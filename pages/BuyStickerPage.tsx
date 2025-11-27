
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { paymentService } from '../services/paymentService';
import { wompiService } from '../services/wompiService';
import { GlobalSettings, Sticker } from '../types';
import { NumberDisplay } from '../components/buy/NumberDisplay';
import { NumberInput } from '../components/buy/NumberInput';
import { UserInfoForm } from '../components/buy/UserInfoForm';
import { Payment } from '../components/buy/Payment';
import { Zap, ShieldCheck } from 'lucide-react';

interface Props {
  onSuccess: (stickerCode: string) => void;
  onBack: () => void;
  isSupercharged: boolean;
}

export const BuyStickerPage: React.FC<Props> = ({ onSuccess, onBack, isSupercharged: isSuperchargedFromHome }) => {
  const [numbers, setNumbers] = useState('');
  const [step, setStep] = useState<'select' | 'user_info' | 'payment_method'>('select');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [dynamicMessage, setDynamicMessage] = useState('');
  const [isSupercharged, setIsSupercharged] = useState(isSuperchargedFromHome);

  // User Info Form
  const [userName, setUserName] = useState('');
  const [countryCode, setCountryCode] = useState('57');
  const [phone, setPhone] = useState('');
  const [pendingSticker, setPendingSticker] = useState<Sticker | null>(null);
  
  // Wallet
  const [userBalance, setUserBalance] = useState(0);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const ticketPrice = settings ? (isSupercharged ? settings.ticketPrice * (settings.superchargeMultiplier || 1) : settings.ticketPrice) : 0;

  useEffect(() => {
    const init = async () => {
        const s = await dbService.getSettings();
        setSettings(s);
        const schedule = await dbService.getLotterySchedule();
        
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1, etc.

        let msg = '';
        const saturdayLottery = schedule.find(item => item.day === 6);

        if (dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 5)) { // Sunday to Friday
             msg = `HOY JUEGA ${formatMoney(s?.dailyPrizeAmount ?? 0)} Y EL SÁBADO ${formatMoney(s?.jackpotAmount ?? 0)}`;
        } else { // Saturday
            if (saturdayLottery) {
                msg = `Juega HOY con la ${saturdayLottery.lottery_name} por ${formatMoney(s?.jackpotAmount ?? 0)}`;
            }
        }

        setDynamicMessage(msg);
    };
    init();
  }, []);

  const handleInput = (num: string) => {
    if (numbers.length < 4) {
      setNumbers(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setNumbers(prev => prev.slice(0, -1));
    setError(null);
  };
  
  const handleClear = () => {
    setNumbers('');
    setError(null);
  };

  const handleRandom = async () => {
    setLoading(true);
    setNumbers(''); // Clear existing numbers
    let randomNum = '';
    randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setNumbers(randomNum);
    setLoading(false);
    setError(null);
  };

  const validateAndProceed = async () => {
    if (numbers.length !== 4) {
      setError("Faltan dígitos");
      return;
    }
    setLoading(true);
    const isTaken = await dbService.isNumberTaken(numbers);
    setLoading(false);
    if (isTaken) {
      setError("Número Ocupado");
      return;
    }
    setStep('user_info');
  };

  const createTicketAndProceed = async (name: string, p: string) => {
      setUserName(name);
      setPhone(p);
      
      setLoading(true);
      const fullPhone = `${countryCode}${p}`;
      const result = await dbService.createPendingTicket(numbers, { 
          fullName: name, 
          phone: fullPhone, 
          countryCode 
      }, ticketPrice, isSupercharged);
      
      if (result.success && result.sticker) {
          setPendingSticker(result.sticker);
          const bal = await dbService.getWalletBalance(fullPhone);
          setUserBalance(bal);
          setStep('payment_method');
      } else {
          setError(result.message);
      }
      setLoading(false);
  };

  const payWithWallet = async () => {
      if (!settings || !pendingSticker) return;
      setLoading(true);
      const fullPhone = `${countryCode}${phone}`;
      
      const result = await dbService.payWithWallet(fullPhone, pendingSticker.id, ticketPrice);
      if (result.success) {
          onSuccess(pendingSticker.code);
      } else {
          setError(result.message);
      }
      setLoading(false);
  };

  const payWithMercadoPago = async () => {
      if (!settings || !pendingSticker) return;
      setLoading(true);
      try {
          await paymentService.createMercadoPagoPreference(ticketPrice, pendingSticker.code);
      } catch (err: any) {
          setLoading(false);
          if (err.message === "MP_TOKEN_MISSING") {
              setError("⚠️ Falta Access Token de Mercado Pago en Admin.");
          } else if (err.message === "MP_UNAUTHORIZED") {
              setError("⚠️ Token Mercado Pago Inválido.");
          } else {
              setError("Error MP: " + err.message);
          }
      }
  };
  
  const payWithWompi = async () => {
    if (!settings || !pendingSticker) return;
    setLoading(true);
    try {
      const paymentLink = await wompiService.createPaymentLink(pendingSticker, { fullName: userName, phone: `${countryCode}${phone}`, countryCode }, settings);
      if (paymentLink) {
        window.location.href = paymentLink;
      } else {
        setError("Error al crear el link de pago de Wompi.");
      }
    } catch (err: any) {
      setError("Error WOMPI: " + err.message);
    }
    setLoading(false);
  };

  if (!settings) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-amber-400 rounded-full border-t-transparent"></div></div>;
  
  if (step === 'user_info') {
      return (
          <UserInfoForm 
            onBack={() => setStep('select')} 
            onSubmit={createTicketAndProceed} 
            loading={loading} 
            error={error} 
            initialName={userName} 
            initialPhone={phone} 
            countryCode={countryCode} 
            onCountryCodeChange={setCountryCode} 
          />
      );
  }

  if (step === 'payment_method') {
      return (
          <Payment 
            onBack={() => setStep('select')} 
            onPayWithWallet={payWithWallet} 
            onPayWithMercadoPago={payWithMercadoPago}
            onPayWithWompi={payWithWompi}
            loading={loading} 
            error={error} 
            numbers={numbers} 
            ticketPrice={ticketPrice} 
            userBalance={userBalance} 
            isSupercharged={isSupercharged} 
            mercadoPagoEnabled={settings.mercadoPagoEnabled || false}
            wompiEnabled={settings.wompiEnabled || false}
            formatMoney={formatMoney} 
          />
      );
  }

  return (
    <div className="flex flex-col h-full justify-end pb-2 space-y-2 px-4">
        <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center space-y-1 mb-3">
                <h2 className="text-lg font-bold text-white">Elige tus 4 Cifras</h2>
                <p className="text-slate-400 text-[10px] uppercase" dangerouslySetInnerHTML={{ __html: dynamicMessage.replace(/(\$\d{1,3}(?:\.\d{3})*)/g, '<span class="font-bold text-white">$1</span>') }}></p>
                 {isSupercharged && settings?.superchargePrizeName && (
                    <div className="text-center">
                        <p className="text-amber-400 font-bold text-[10px] uppercase animate-pulse">
                            Y JUEGA TAMBIÉN POR {settings.superchargePrizeName}
                        </p>
                        <p className="text-slate-400 font-bold text-[9px] uppercase">
                           (Juega el Sábado con el Acumulado)
                        </p>
                    </div>
                )}
            </div>

            {settings.superchargeMultiplier > 1 && (
                <div className={`w-full max-w-sm mx-auto rounded-lg transition-all mb-2 overflow-hidden relative`}>
                    <button 
                        onClick={() => setIsSupercharged(!isSupercharged)}
                        className={`w-full transition-all active:scale-95 disabled:opacity-50 ${isSupercharged ? 'bg-amber-400 text-navy-950' : 'bg-navy-800 text-amber-400'}`}
                    >
                        <div className="flex items-center justify-between p-2">
                            <Zap size={20} className="-ml-1" />
                            <div className="text-center">
                                <span className="font-bold uppercase tracking-wider block text-sm">Potenciado</span>
                                <span className="font-black text-lg">x{settings.superchargeMultiplier}</span>
                            </div>
                            {settings.superchargePrizeImage && (
                                <img src={settings.superchargePrizeImage} alt="Premio Potenciado" className="w-20 h-auto rounded-md" />
                            )}
                        </div>
                    </button>
                </div>
            )}

            <NumberDisplay numbers={numbers} loading={loading} error={error} />

        </div>

        {numbers.length === 4 ? (
            <div className="w-full max-w-sm mx-auto space-y-2">
                <NumberInput 
                    numbers={numbers} 
                    loading={loading} 
                    error={error} 
                    onInput={handleInput} 
                    onDelete={handleDelete} 
                    onClear={handleClear} 
                    onRandom={handleRandom} 
                />
                <button 
                    onClick={validateAndProceed} 
                    disabled={loading}
                    className='w-full bg-green-500 hover:bg-green-600 text-white rounded-xl p-3 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(34,197,94,0.3)] border border-green-400/50 flex items-center justify-between'
                >
                    <div className='flex items-center gap-2'>
                        <ShieldCheck size={24} />
                        <span className='text-lg font-black tracking-wide'>Verificar y Pagar</span>
                    </div>
                    <div className='bg-white/10 px-3 py-1 rounded-lg text-base font-bold'>
                        {formatMoney(ticketPrice)}
                    </div>
                </button>
            </div>
        ) : (
             <NumberInput 
                numbers={numbers} 
                loading={loading} 
                error={error} 
                onInput={handleInput} 
                onDelete={handleDelete} 
                onClear={handleClear} 
                onRandom={handleRandom} 
            />
        )}
      
    </div>
  );
}
