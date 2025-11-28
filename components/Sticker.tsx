import React, { useState, useEffect } from 'react';
import { Sticker as StickerType, GlobalSettings, LotterySchedule } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, Clock, Star, Trophy, X, Zap, CreditCard, Wallet, User } from 'lucide-react';
import { dbService } from '../services/db';

interface Props {
  sticker: StickerType;
  settings: GlobalSettings | null;
  onPayWithWallet: (sticker: StickerType) => void;
  onPayWithMercadoPago: (sticker: StickerType) => void;
  onPayWithWompi: (sticker: StickerType) => void; // Added Wompi handler
  loading: boolean;
  walletBalance: number;
  formatMoney: (value: number) => string;
  mercadoPagoEnabled: boolean; // Added for dynamic buttons
  wompiEnabled: boolean; // Added for dynamic buttons
  isSellerView?: boolean;
}

export const Sticker: React.FC<Props> = ({ 
    sticker, 
    settings, 
    onPayWithWallet, 
    onPayWithMercadoPago, 
    onPayWithWompi, 
    loading, 
    walletBalance, 
    formatMoney, 
    mercadoPagoEnabled,
    wompiEnabled,
    isSellerView
}) => {
  const [paymentOptionsVisible, setPaymentOptionsVisible] = useState<string | null>(null);
  const [lotterySchedule, setLotterySchedule] = useState<LotterySchedule[]>([]);

  useEffect(() => {
    const loadSchedule = async () => {
        const schedule = await dbService.getLotterySchedule();
        setLotterySchedule(schedule);
    };
    loadSchedule();
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday 0, Saturday 6

  let dayForLottery = dayOfWeek;
  if (dayOfWeek === 0) { // On Sunday
      dayForLottery = 1; // Show Monday's lottery
  }
  const currentLottery = lotterySchedule.find(item => item.day === dayForLottery);
  const saturdayLottery = lotterySchedule.find(item => item.day === 6);

  const verifyUrl = `${window.location.origin}/?view=verify&code=${sticker.code}`;
  const isPending = sticker.status === 'pending';
  const isWinner = !isPending && settings?.winningNumber && settings.winningNumber === sticker.numbers;
  const purchasedDate = new Date(sticker.purchasedAt);
  
  let prizeAmount = 0;
  if (isWinner && settings) {
    const isSaturdayPurchase = purchasedDate.getDay() === 6;
    prizeAmount = isSaturdayPurchase ? settings.jackpotAmount : settings.dailyPrizeAmount;
  }

  const price = sticker.price || (sticker.isSupercharged && settings ? settings.ticketPrice * settings.superchargeMultiplier : settings?.ticketPrice) || 0;

  const renderDailyLotteryInfo = () => {
    if (!settings) return null;

    let infoText = '';

    if (dayOfWeek === 6) { // It's Saturday
        if (saturdayLottery) {
            infoText = `Hoy juega el Acumulado de ${formatMoney(settings.jackpotAmount)} con ${saturdayLottery.lottery_name}`;
        }
    } else if (dayOfWeek === 0) { // It's Sunday
        if (currentLottery) { // This is Monday's lottery
            infoText = `Mañana juega por ${formatMoney(settings.dailyPrizeAmount)} con ${currentLottery.lottery_name}`;
        }
    } else { // It's a weekday
        if (currentLottery) {
            infoText = `Hoy juega por ${formatMoney(settings.dailyPrizeAmount)} con ${currentLottery.lottery_name}`;
        }
    }

    if (!infoText) return null;

    return (
        <div className="text-xs text-center text-slate-400 mt-2 p-2 bg-navy-800/50 rounded-lg">
            {infoText}
        </div>
    );
  };

  if (isWinner) {
    return (
      <div key={sticker.id} className="group relative">
        <div className="bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500 rounded-2xl border-2 border-yellow-200 p-1 shadow-[0_0_25px_rgba(252,211,77,0.8)]">
          <div className="bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center">
            <Trophy size={32} className="text-white mb-2" />
            <span className="font-black text-4xl text-white tracking-widest drop-shadow-lg">GANADOR</span>
            <div className="text-5xl font-mono font-black tracking-widest text-white my-3">{sticker.numbers}</div>
            <div className="text-2xl font-bold text-white mb-3">{formatMoney(prizeAmount)}</div>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded text-sm font-mono font-bold text-white">{sticker.code}</span>
          </div>
        </div>
      </div>
    );
  }

  const ticketBorder = isPending
    ? (sticker.isSupercharged ? 'border-amber-400/30' : 'border-yellow-500/30')
    : (sticker.isSupercharged ? 'border-amber-400' : 'border-brand-500/30');

  const ticketHeader = isPending
    ? (sticker.isSupercharged ? 'from-amber-500 to-amber-400' : 'from-yellow-600 to-yellow-500')
    : (sticker.isSupercharged ? 'from-amber-500 to-amber-400' : 'from-brand-600 via-brand-500 to-brand-400');

  return (
    <div key={sticker.id} className="group relative">
      <div className={`bg-navy-card rounded-2xl border ${ticketBorder} overflow-hidden shadow-lg transition-transform active:scale-[0.98]`}>
        <div className={`p-1 relative overflow-hidden bg-gradient-to-r ${ticketHeader}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="font-black text-[10px] uppercase tracking-widest text-navy-950 flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {isPending ? 'PENDIENTE DE PAGO' : (isSellerView ? 'VENDIDO A:' : 'GanarApp')}
            </span>
            <span className="bg-navy-950/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-navy-950">{sticker.code}</span>
          </div>
        </div>

        <div className="p-4 flex items-start justify-between relative bg-gradient-to-b from-navy-900 to-navy-950">
          <div className='flex-1 pr-4'>
             {isSellerView && sticker.ownerData && (
                <div className="text-xs text-slate-300 mb-2 flex items-center gap-2">
                    <User size={14} /> {sticker.ownerData.fullName}
                </div>
            )}
            <div className="flex items-center gap-2 mb-2">
                <div className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Zap size={8} fill="currentColor"/> Diario
                </div>
                <div className="text-[9px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star size={8} fill="currentColor"/> Semanal
                </div>
            </div>
            <div className={`text-5xl font-mono font-black tracking-widest ${isPending ? 'text-yellow-500' : (sticker.isSupercharged ? 'text-amber-400' : 'text-white')} group-hover:text-brand-400 transition-colors shadow-black drop-shadow-sm`}>
                {sticker.numbers}
            </div>
            <div className="text-slate-400 font-bold text-lg mt-1">{formatMoney(price || 0)}</div>
            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Calendar size={10}/> {new Date(sticker.purchasedAt).toLocaleDateString()} {new Date(sticker.purchasedAt).toLocaleTimeString()}
            </div>
            {isPending && (
                <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> Expira en 1 hora
                </div>
            )}
            {!isPending && renderDailyLotteryInfo()}
          </div>
          
          <div className="flex flex-col items-center justify-start h-full w-[90px] flex-shrink-0">
            <div className="bg-white/10 p-1.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-80 flex flex-col items-center justify-center w-[80px] h-[80px]">
                {isPending ? (
                     <div className="relative w-full h-full">
                        {paymentOptionsVisible === sticker.id ? (
                            <div className='absolute right-0 top-0 w-[120px] bg-navy-800 rounded-lg p-1.5 flex flex-col gap-1.5 z-10 animate-in fade-in duration-300 shadow-2xl'>
                                <button onClick={() => setPaymentOptionsVisible(null)} className='absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 z-20'><X size={12}/></button>
                                
                                {walletBalance >= price && (
                                    <button 
                                        onClick={() => onPayWithWallet(sticker)} 
                                        disabled={loading}
                                        className='w-full flex items-center justify-center gap-2 p-2 bg-green-500 text-navy-950 rounded-md text-[10px] font-black disabled:bg-gray-500 disabled:opacity-50'
                                    ><Wallet size={12}/> CON SALDO</button>
                                )}

                                {mercadoPagoEnabled && (
                                    <button 
                                        onClick={() => onPayWithMercadoPago(sticker)} 
                                        disabled={loading}
                                        className='w-full flex items-center justify-center gap-2 p-2 bg-blue-500 text-white rounded-md text-[10px] font-black disabled:bg-gray-500 disabled:opacity-50'
                                    ><CreditCard size={12}/> MERCADOPAGO</button>
                                )}

                                {wompiEnabled && (
                                     <button 
                                        onClick={() => onPayWithWompi(sticker)} 
                                        disabled={loading}
                                        className='w-full flex items-center justify-center gap-2 p-2 bg-purple-600 text-white rounded-md text-[10px] font-black disabled:bg-gray-500 disabled:opacity-50'
                                    ><CreditCard size={12}/> WOMPI</button>
                                )}

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
            {sticker.isSupercharged && settings?.superchargePrizeImage && (
                <div className="relative mt-3 w-24 flex flex-col items-center">
                     <img 
                        src={settings.superchargePrizeImage} 
                        alt="Potenciado" 
                        className="w-full h-auto drop-shadow-lg -mb-2 transform -rotate-12"
                    />
                    <p className="text-[9px] font-bold text-navy-950 bg-amber-400 px-2 py-0.5 rounded-md shadow-lg">
                        {dayOfWeek === 6 ? "JUEGA HOY" : "JUEGA EL SÁBADO"}
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};