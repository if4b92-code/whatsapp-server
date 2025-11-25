
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { paymentService } from '../services/paymentService';
import { GlobalSettings, Sticker } from '../types';
import { AlertTriangle, Dices, Trash2, ShieldCheck, ArrowLeft, ArrowRight, CreditCard, User, Phone, CheckCircle, Wallet, Zap } from 'lucide-react';

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
    // For simplicity, we'll just generate a random number client-side.
    // A check for uniqueness can be added if required, as in the original code.
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
    setStep('user_info'); // Go to User Info Form
  };

  const createTicketAndProceed = async () => {
      if (!userName || !phone) {
          setError("Nombre y WhatsApp son obligatorios");
          return;
      }
      
      setLoading(true);
      const fullPhone = `${countryCode}${phone}`;
      const result = await dbService.createPendingTicket(numbers, {
          fullName: userName,
          phone: fullPhone,
          countryCode,
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

  if (!settings) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-amber-400 rounded-full border-t-transparent"></div></div>;
  
  // USER INFO FORM STEP
  if (step === 'user_info') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-300 h-full flex flex-col px-4">
            <button onClick={() => setStep('select')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-bold">
                <ArrowLeft size={16} /> Volver a Números
            </button>

            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white">Tus Datos</h2>
                <p className="text-slate-400 text-xs">Necesarios para vincular tu ticket <span className="text-amber-400 font-bold">#{numbers}</span></p>
            </div>

            <div className="space-y-4 bg-navy-900 p-5 rounded-2xl border border-white/5">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nombre Completo</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input 
                            type="text" 
                            required 
                            value={userName} 
                            onChange={e => setUserName(e.target.value)}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-amber-500 outline-none"
                            placeholder="Tu nombre"
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">WhatsApp / Celular</label>
                    <div className="flex gap-2">
                        <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-3.5 text-slate-500 text-xs">+</span>
                            <input 
                                type="text" 
                                value={countryCode} 
                                onChange={e => setCountryCode(e.target.value.replace(/\D/g,''))}
                                className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-6 text-white text-sm text-center focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="relative flex-1">
                            <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
                            <input 
                                type="tel" 
                                required 
                                value={phone} 
                                onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                                className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-amber-500 outline-none"
                                placeholder="Número"
                            />
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Usaremos este número para que veas tus tickets.</p>
                </div>
            </div>

            {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}

            <button 
                onClick={createTicketAndProceed}
                disabled={!userName || !phone || loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Generando Ticket...' : <>CONTINUAR <ArrowRight size={20}/></>}
            </button>
        </div>
      );
  }

  // PAYMENT METHOD STEP
  if (step === 'payment_method') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-300 h-full flex flex-col px-4">
             <button onClick={() => setStep('select')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-bold">
                <ArrowLeft size={16} /> Cancelar Compra
            </button>

            <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-500/20">
                    <CheckCircle size={14}/> Ticket Generado
                </div>
                <h2 className="text-2xl font-bold text-white">Realizar Pago</h2>
                <div className="text-6xl font-mono font-black text-amber-400 my-2 drop-shadow-lg tracking-widest">
                    {numbers}
                </div>
                <p className="text-slate-400 text-sm">Valor a pagar: <span className="text-white font-bold">{formatMoney(ticketPrice)}</span></p>
                {isSupercharged && <p className='text-xs text-amber-400 font-bold'>¡TICKET POTENCIADO!</p>}
            </div>

            <div className="space-y-4 flex-1">
                {userBalance >= ticketPrice && (
                    <button 
                        onClick={payWithWallet}
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 rounded-xl h-16 transition-all active:scale-[0.98] shadow-lg flex items-center px-6 relative overflow-hidden group mb-4 border border-green-400/20"
                    >
                        <div className="flex items-center gap-4 w-full">
                            <div className="w-10 h-10 bg-navy-950/20 rounded-lg flex items-center justify-center shrink-0">
                                 <Wallet size={20} className="text-navy-950" />
                            </div>
                            <div className="text-left flex-1">
                                <span className="text-navy-950 font-black text-lg block leading-tight">USAR TU SALDO</span>
                                <span className="text-navy-900 font-bold text-xs">Disponible: {formatMoney(userBalance)}</span>
                            </div>
                            <CheckCircle size={24} className="text-navy-950 shrink-0" />
                        </div>
                    </button>
                )}

                <button 
                    onClick={payWithMercadoPago}
                    disabled={loading}
                    className="w-full bg-[#009EE3] hover:bg-[#008CC9] rounded-xl h-16 transition-all active:scale-[0.98] shadow-lg flex items-center px-6 relative overflow-hidden group"
                >
                    <div className="flex items-center gap-4 w-full">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                             <CreditCard size={20} className="text-white" />
                        </div>
                        <div className="text-left flex-1">
                            <span className="text-white font-black text-lg block leading-tight">PAGAR CON MERCADO PAGO</span>
                            <span className="text-blue-100 text-xs font-medium">PSE, Tarjetas, Nequi, Efecty</span>
                        </div>
                        <ArrowRight size={24} className="text-white group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    {loading && <div className="absolute inset-0 bg-navy-950/50 z-20 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div></div>}
                </button>
            </div>
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-2 animate-pulse text-center mt-auto">
                    <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold">
                        <AlertTriangle size={16} className="shrink-0" /> 
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // NUMBER SELECTION STEP
  return (
    <div className="flex flex-col h-full justify-end pb-4 space-y-4 px-4">
        <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-xl font-bold text-white">Elige tus 4 Cifras</h2>
                <p className="text-slate-400 text-xs uppercase" dangerouslySetInnerHTML={{ __html: dynamicMessage.replace(/(\$\d{1,3}(?:\.\d{3})*)/g, '<span class="font-bold text-white">$1</span>') }}></p>
                 {isSupercharged && settings?.superchargePrizeName && (
                    <p className="text-amber-400 font-bold text-xs uppercase animate-pulse">
                        Y JUEGA TAMBIÉN POR {settings.superchargePrizeName}
                    </p>
                )}
            </div>
            
            <div className={`w-full max-w-sm mx-auto bg-navy-900 p-6 rounded-2xl border-2 ${error ? 'border-red-500/50' : 'border-navy-800'} flex flex-col items-center justify-center relative shadow-inner mb-4`}>
                <div className="text-6xl font-mono font-bold tracking-[0.3em] text-white min-h-[4rem] z-10">
                    {loading ? <div className="animate-pulse text-white/20">----</div> : numbers.padEnd(4, ' ')}
                </div>
                {error && (
                    <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1 text-red-400 text-xs font-bold animate-pulse">
                        <AlertTriangle size={12} /> {error}
                    </div>
                )}
            </div>

           {settings.superchargeMultiplier > 1 && (
                <button 
                    onClick={() => setIsSupercharged(!isSupercharged)}
                    className={`w-full max-w-sm mx-auto rounded-lg transition-all active:scale-95 disabled:opacity-50 mb-3 overflow-hidden ${isSupercharged ? 'bg-amber-400 text-navy-950' : 'bg-navy-800 text-amber-400'}`}
                >
                    <div className="flex items-center justify-between p-3">
                        <Zap size={24} className="-ml-1" />
                        <div className="text-center">
                            <span className="font-bold uppercase tracking-wider block">Potenciado</span>
                            <span className="font-black text-xl">x{settings.superchargeMultiplier}</span>
                        </div>
                        {settings.superchargePrizeImage && (
                            <img src={settings.superchargePrizeImage} alt="Premio Potenciado" className="w-24 h-auto rounded-md" />
                        )}
                    </div>
                </button>
            )}
        </div>

      <div className="w-full max-w-sm mx-auto">
         {numbers.length < 4 ? (
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                    key={num}
                    onClick={() => handleInput(num.toString())}
                    disabled={loading}
                    className="bg-navy-700 hover:bg-navy-600 text-2xl font-bold py-4 rounded-lg transition-all text-white active:bg-navy-500"
                >
                    {num}
                </button>
                ))}
                <button onClick={handleDelete} className="bg-navy-700 text-red-400/80 font-bold py-4 rounded-lg flex items-center justify-center hover:text-red-400 active:bg-navy-500"><Trash2 size={24} /></button>
                <button onClick={() => handleInput('0')} disabled={loading} className="bg-navy-700 hover:bg-navy-600 text-2xl font-bold py-4 rounded-lg transition-all text-white active:bg-navy-500">0</button>
                <button 
                    onClick={handleRandom}
                    disabled={loading}
                    className="bg-navy-700 hover:bg-navy-600 text-amber-400 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Dices size={18} /> {loading ? '...' : 'Aleatorio'}
                </button>
            </div>
         ) : (
            <div className="space-y-3">
                 <div className="flex items-center justify-center gap-3">
                    <button onClick={handleClear} className="text-red-400/80 font-bold p-3 rounded-lg flex items-center justify-center hover:text-red-400 transition-colors text-xs uppercase gap-1"><Trash2 size={16} /> Limpiar</button>
                    <span className="text-slate-600">|</span>
                    <button onClick={handleRandom} className="text-amber-400/80 font-bold p-3 rounded-lg flex items-center justify-center hover:text-amber-400 transition-colors text-xs uppercase gap-1"><Dices size={16} /> Aleatorio</button>
                </div>
                <button 
                    onClick={validateAndProceed} 
                    disabled={loading}
                    className='w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(34,197,94,0.3)] border border-green-400/50 flex items-center justify-between'
                >
                    <div className='flex items-center gap-3'>
                        <ShieldCheck size={32} />
                        <span className='text-xl font-black tracking-wide'>Verificar y Pagar</span>
                    </div>
                    <div className='bg-white/10 px-4 py-2 rounded-lg text-lg font-bold'>
                        {formatMoney(ticketPrice)}
                    </div>
                </button>
            </div>
         )}
      </div>
    </div>
  );
}
