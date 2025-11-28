import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { paymentService } from '../services/paymentService';
import { wompiService } from '../services/wompiService';
import { Sticker as StickerType, GlobalSettings } from '../types';
import { Ticket } from 'lucide-react';
import { Login } from '../components/Login';
import { WalletHeader } from '../components/WalletHeader';
import { Sticker } from '../components/Sticker';

interface Props {
  onSuccess: (stickerCode: string) => void;
}

export const WalletPage: React.FC<Props> = ({ onSuccess }) => {
  const [stickers, setStickers] = useState<StickerType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [isSellerView, setIsSellerView] = useState(false);

  useEffect(() => {
    const init = async () => {
      const s = await dbService.getSettings();
      setSettings(s);

      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        setPhone(savedPhone);
        await fetchUserData(savedPhone);
        setIsLoggedIn(true);
      } else {
        setLoading(false);
      }
    };
    init();

    const interval = setInterval(() => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(21, 30, 0, 0); // 9:30 PM

        if (now > target) {
            setCountdown("El sorteo ha finalizado por hoy.");
            return;
        }

        const diff = target.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 7) return;
    setLoginError('');
    setLoading(true);

    let searchPhone = phone.replace(/\D/g, '');
    if (searchPhone.length === 10) searchPhone = '57' + searchPhone;
    setPhone(searchPhone);

    const codeSent = await dbService.generateUserAccessCode(searchPhone);

    if (!codeSent) {
        setLoginError('No pudimos generar tu código. Intenta de nuevo.');
        setLoading(false);
        return;
    }

    setStep('code');
    setLoading(false);
  };

  const fetchUserData = async (userPhone: string) => {
    setLoading(true);
    const [userStickers, balance, settingsData] = await Promise.all([
        dbService.getStickersByPhone(userPhone),
        dbService.getWalletBalance(userPhone),
        dbService.getSettings(),
    ]);
    const sortedStickers = userStickers.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    setStickers(sortedStickers);
    setWalletBalance(balance);
    setSettings(settingsData);

    // Check if it's a seller view
    const sellerMode = localStorage.getItem('sellerMode') === 'true';
    const sellerPhone = localStorage.getItem('sellerPhone');
    setIsSellerView(sellerMode && sellerPhone === userPhone);

    setLoading(false);
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setLoginError('');

      const isValid = await dbService.validateUserAccessCode(phone, accessCode);
      if (isValid) {
          localStorage.setItem('userPhone', phone);
          await fetchUserData(phone);
          setIsLoggedIn(true);
      } else {
          setLoginError('Código incorrecto. Pídelo al administrador.');
      }
      setLoading(false);
  };

  const handlePayWithWallet = async (sticker: StickerType) => {
      if (!settings) return;
      const price = sticker.price || settings.ticketPrice;
      setLoading(true);
      const result = await dbService.payWithWallet(phone, sticker.id, price);
      if (result.success) {
          onSuccess(sticker.code);
      } else {
          alert(result.message);
      }
      setLoading(false);
  }

  const handlePayWithMercadoPago = async (sticker: StickerType) => {
      if (!settings) return;
      const price = sticker.price || settings.ticketPrice;
      try {
          await paymentService.createMercadoPagoPreference(price, sticker.code);
      } catch (err: any) {
          if (err.message === "MP_TOKEN_MISSING") {
              alert("⚠️ Error de Configuración: Falta Access Token de Mercado Pago en Admin.");
          } else if (err.message === "MP_UNAUTHORIZED") {
              alert("⚠️ Token Mercado Pago Inválido. Verifica en Admin.");
          } else {
              alert("Error iniciando pago Mercado Pago: " + err.message);
          }
      }
  };

  const handlePayWithWompi = async (sticker: StickerType) => {
      if (!settings) return;
      setLoading(true);
      try {
          const paymentLink = await wompiService.createPaymentLink(sticker, sticker.ownerData, settings);
          if (paymentLink) {
              window.location.href = paymentLink;
          } else {
              alert("Error al crear el link de pago de Wompi.");
          }
      } catch (err: any) {
          alert("Error WOMPI: " + err.message);
      }
      setLoading(false);
  };
  
  const handleLogout = () => {
      localStorage.removeItem('userPhone');
      setIsLoggedIn(false);
      setStep('phone');
      setPhone('');
      setAccessCode('');
      setStickers([]);
      setWalletBalance(0);
  };

  const contactAdmin = () => {
      if (!settings?.adminWhatsApp) return;
      const url = `https://wa.me/${settings.adminWhatsApp}?text=Hola, soy el usuario ${phone} y necesito mi Código de Acceso para ver mis tickets.`;
      window.open(url, '_blank');
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading && !isLoggedIn) {
    return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;
  }

  if (!isLoggedIn) {
      return (
          <Login 
            step={step} 
            phone={phone} 
            setPhone={setPhone} 
            accessCode={accessCode} 
            setAccessCode={setAccessCode} 
            loginError={loginError} 
            loading={loading} 
            handlePhoneSubmit={handlePhoneSubmit} 
            handleCodeSubmit={handleCodeSubmit} 
            contactAdmin={contactAdmin} 
            setStep={setStep} 
            setLoginError={setLoginError} 
          />
      );
  }

  return (
    <div className="space-y-6">
        <button onClick={handleLogout} className="text-xs text-red-400 underline absolute top-4 right-4 z-10">Salir</button>
        <WalletHeader 
            stickersCount={stickers.length}
            countdown={countdown}
            settings={settings}
            walletBalance={walletBalance}
            formatMoney={formatMoney}
        />
        
        {loading ? (
            <div className="flex justify-center mt-10"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>
        ) : (stickers.length === 0 && walletBalance > 0) ? (
             <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-4 bg-navy-card/50 rounded-2xl border border-white/5 border-dashed">
                <Ticket size={40} className="opacity-50" />
                <p className="text-sm">No tienes tickets, ¡pero tienes saldo para comprar!</p>
             </div>
        ) : stickers.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-4 bg-navy-card/50 rounded-2xl border border-white/5 border-dashed">
                <Ticket size={40} className="opacity-50" />
                <p className="text-sm">No tienes tickets activos.</p>
             </div>
        ) : (
          <div className="space-y-4">
            {stickers.map((sticker) => (
              <Sticker 
                  key={sticker.id}
                  sticker={sticker}
                  settings={settings}
                  onPayWithWallet={handlePayWithWallet}
                  onPayWithMercadoPago={handlePayWithMercadoPago}
                  onPayWithWompi={handlePayWithWompi}
                  loading={loading}
                  walletBalance={walletBalance}
                  formatMoney={formatMoney}
                  mercadoPagoEnabled={settings?.mercadoPagoEnabled || false}
                  wompiEnabled={settings?.wompiEnabled || false}
                  isSellerView={isSellerView}
              />
            ))}
          </div>
      )}
    </div>
  );
};