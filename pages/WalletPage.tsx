
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { paymentService } from '../services/paymentService';
import { Sticker, GlobalSettings } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Ticket, Star, Calendar, Zap, Phone, ArrowRight, Lock, Clock, Key, HelpCircle, Wallet, X, Trophy } from 'lucide-react';

interface Props {
  onSuccess: (stickerCode: string) => void;
}

export const WalletPage: React.FC<Props> = ({ onSuccess }) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentOptionsVisible, setPaymentOptionsVisible] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const init = async () => {
       const s = await dbService.getSettings();
       setSettings(s);
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
      
      let searchPhone = phone.replace(/\D/g, '');
      if (searchPhone.length === 10) searchPhone = '57' + searchPhone;
      setPhone(searchPhone);

      const userStickers = await dbService.getStickersByPhone(searchPhone);
      if (userStickers.length === 0) {
          const balance = await dbService.getWalletBalance(searchPhone);
          if(balance === 0){
            setLoginError('No se encontraron tickets con este número.');
            return;
          }
      }

      setStep('code');
  };

  const fetchUserData = async (userPhone: string) => {
    const [userStickers, balance, settingsData] = await Promise.all([
        dbService.getStickersByPhone(userPhone),
        dbService.getWalletBalance(userPhone),
        dbService.getSettings(),
    ]);
    const sortedStickers = userStickers.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    setStickers(sortedStickers);
    setWalletBalance(balance);
    setSettings(settingsData);
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setLoginError('');

      const isValid = await dbService.validateUserAccessCode(phone, accessCode);
      if (isValid) {
          await fetchUserData(phone);
          setIsLoggedIn(true);
      } else {
          setLoginError('Código incorrecto. Pídelo al administrador.');
      }
      setLoading(false);
  };

  const handlePayWithWallet = async (sticker: Sticker) => {
      if (!settings) return;
      setLoading(true);
      const result = await dbService.payWithWallet(phone, sticker.id, settings.ticketPrice);
      if (result.success) {
          onSuccess(sticker.code);
      } else {
          alert(result.message);
      }
      setLoading(false);
  }

  const handlePayWithMercadoPago = async (sticker: Sticker) => {
      if (!settings) return;
      try {
          await paymentService.createMercadoPagoPreference(settings.ticketPrice, sticker.code);
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

  const contactAdmin = () => {
      if (!settings?.adminWhatsApp) return;
      const url = `https://wa.me/${settings.adminWhatsApp}?text=Hola, soy el usuario ${phone} y necesito mi Código de Acceso para ver mis tickets.`;
      window.open(url, '_blank');
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (!isLoggedIn) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] px-4 space-y-6 animate-in fade-in duration-500">
               <div className="w-20 h-20 rounded-2xl bg-navy-card border border-white/10 flex items-center justify-center shadow-glow">
                    <Lock className="text-brand-500" size={32} />
               </div>
               <div className="text-center">
                   <h2 className="text-2xl font-bold text-white">Mis Tickets</h2>
                   <p className="text-slate-400 text-sm">Acceso seguro a tu bóveda personal.</p>
               </div>
               
               {step === 'phone' ? (
                   <form onSubmit={handlePhoneSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <Phone size={18} className="absolute left-3 top-3.5 text-slate-500" />
                            <input 
                                type="tel" 
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Número de WhatsApp"
                                className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-10 text-white text-center text-lg focus:border-brand-500 outline-none"
                            />
                        </div>
                        {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                        <button className="w-full bg-brand-500 text-navy-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                            CONTINUAR <ArrowRight size={18}/>
                        </button>
                   </form>
               ) : (
                   <form onSubmit={handleCodeSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <Key size={18} className="absolute left-3 top-3.5 text-slate-500" />
                            <input 
                                type="text" 
                                value={accessCode}
                                onChange={e => setAccessCode(e.target.value)}
                                placeholder="Código de Acceso (6 dígitos)"
                                className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-10 text-white text-center text-lg focus:border-brand-500 outline-none tracking-widest"
                            />
                        </div>
                        {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                        
                        <button disabled={loading} className="w-full bg-brand-500 text-navy-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                            {loading ? <div className='w-5 h-5 border-2 border-navy-950 rounded-full border-t-transparent animate-spin'></div> : 'ENTRAR AHORA'}
                        </button>

                        <button 
                            type="button"
                            onClick={contactAdmin}
                            className="w-full text-slate-500 text-xs flex items-center justify-center gap-1 hover:text-white mt-4"
                        >
                            <HelpCircle size={12} /> No tengo código / Solicitar al Admin
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setStep('phone'); setLoginError(''); }}
                            className="w-full text-brand-500 text-xs mt-2"
                        >
                            Cambiar número
                        </button>
                   </form>
               )}
          </div>
      );
  }

  if (loading) {
    return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="text-brand-500" /> Mis Tickets <span className="text-slate-500 text-sm font-normal">({stickers.length})</span>
            </h2>
            <button onClick={() => { setIsLoggedIn(false); setStep('phone'); setPhone(''); setAccessCode(''); }} className="text-xs text-red-400 underline">Salir</button>
        </div>

        {/* Lottery Info */}
        <div className="bg-navy-card p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400">Próximo Sorteo:</span>
                <span className="font-mono font-bold text-white">{countdown}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400">Número Ganador:</span>
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-400"/>
                    <span className="font-mono font-bold text-2xl text-yellow-400 tracking-widest">{settings?.winningNumber || '----'}</span>
                </div>
            </div>
        </div>


        {/* Wallet Balance */}
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-4 rounded-2xl flex justify-between items-center border border-white/10">
            <div className="flex items-center gap-3">
                <Wallet size={20} className="text-green-400"/>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Saldo Billetera</span>
            </div>
            <div className="text-2xl font-mono font-black text-white">{formatMoney(walletBalance)}</div>
        </div>

        {(stickers.length === 0 && walletBalance > 0) ? (
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
          stickers.map((sticker) => {
            const verifyUrl = `${window.location.origin}/?view=verify&code=${sticker.code}`;
            const isPending = sticker.status === 'pending';

            return (
                <div key={sticker.id} className="group relative">
                    <div className={`bg-navy-card rounded-2xl border ${isPending ? 'border-yellow-500/30' : 'border-brand-500/30'} overflow-hidden shadow-lg transition-transform active:scale-[0.98]`}>
                        <div className={`p-1 relative overflow-hidden bg-gradient-to-r ${isPending ? 'from-yellow-600 to-yellow-500' : 'from-brand-600 via-brand-500 to-brand-400'}`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            <div className="flex justify-between items-center px-3 py-1">
                                <span className="font-black text-[10px] uppercase tracking-widest text-navy-950 flex items-center gap-1">
                                    <Star size={10} fill="currentColor" /> {isPending ? 'PENDIENTE DE PAGO' : 'GanarApp'}
                                </span>
                                <span className="bg-navy-950/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-navy-950">{sticker.code}</span>
                            </div>
                        </div>

                        <div className="p-4 flex items-center justify-between relative bg-gradient-to-b from-navy-900 to-navy-950">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Zap size={8} fill="currentColor"/> Diario
                                    </div>
                                    <div className="text-[9px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Star size={8} fill="currentColor"/> Semanal
                                    </div>
                                </div>
                                <div className={`text-5xl font-mono font-black tracking-widest ${isPending ? 'text-yellow-500' : 'text-white group-hover:text-brand-400'} transition-colors shadow-black drop-shadow-sm`}>
                                    {sticker.numbers}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                    <Calendar size={10}/> {new Date(sticker.purchasedAt).toLocaleDateString()}
                                </div>
                                {isPending && (
                                    <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                                        <Clock size={10} /> Expira en 1 hora
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-white/10 p-1.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-80 flex flex-col items-center justify-center w-[80px] h-[80px]">
                                {isPending ? (
                                     <div className="relative w-full h-full">
                                        {paymentOptionsVisible === sticker.id ? (
                                            <div className='absolute inset-0 bg-navy-800 rounded-lg p-1.5 flex flex-col gap-1.5 z-10 animate-in fade-in duration-300'>
                                                <button onClick={() => setPaymentOptionsVisible(null)} className='absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 z-20'><X size={12}/></button>
                                                <button 
                                                    onClick={() => handlePayWithWallet(sticker)} 
                                                    disabled={loading || walletBalance < (settings?.ticketPrice || 0)}
                                                    className='w-full flex-1 bg-green-500 text-navy-950 rounded-md text-[10px] font-black disabled:bg-gray-500 disabled:opacity-50'
                                                >CON SALDO</button>
                                                <button onClick={() => handlePayWithMercadoPago(sticker)} className='w-full flex-1 bg-blue-500 text-white rounded-md text-[10px] font-black'>MERCADO PAGO</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setPaymentOptionsVisible(sticker.id)}
                                                className="w-full h-full bg-brand-500 hover:bg-brand-400 text-navy-950 font-black text-xs leading-tight text-center rounded-md flex flex-col items-center justify-center p-1"
                                            >
                                                PAGAR<br/>AHORA
                                            </button>
                                        )}
                                     </div>
                                ) : (
                                    <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className='bg-white rounded-lg'>
                                        <QRCodeCanvas 
                                            value={verifyUrl}
                                            size={70}
                                            level={"M"}
                                            includeMargin={false}
                                        />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
          })
      )}
    </div>
  );
};
