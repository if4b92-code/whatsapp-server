
import React, { useState } from 'react';
import { Sticker, GlobalSettings } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Ticket, Star, Calendar, Zap, Wallet, X, Trophy } from 'lucide-react';

interface StickerCardProps {
  sticker: Sticker;
  settings: GlobalSettings | null;
  walletBalance: number;
  onPayWithWallet: (sticker: Sticker) => void;
  onPayWithMercadoPago: (sticker: Sticker) => void;
  loading: boolean;
}

export const StickerCard: React.FC<StickerCardProps> = ({ sticker, settings, walletBalance, onPayWithWallet, onPayWithMercadoPago, loading }) => {
  const [paymentOptionsVisible, setPaymentOptionsVisible] = useState<string | null>(null);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const verifyUrl = `${window.location.origin}/?view=verify&code=${sticker.code}`;
  const isPending = sticker.status === 'pending';
  const isWinner = !isPending && settings?.winningNumber && settings.winningNumber === sticker.numbers;
  const purchasedDate = new Date(sticker.purchasedAt);
  const isSaturday = purchasedDate.getDay() === 6;

  let prizeAmount = 0;
  if (isWinner && settings) {
      prizeAmount = isSaturday ? settings.jackpotAmount : settings.dailyPrizeAmount;
  }

  if (isWinner) {
    return (
      <div key={sticker.id} className="group relative">
          <div className="bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500 rounded-2xl border-2 border-yellow-200 p-1 shadow-[0_0_25px_rgba(252,211,77,0.8)]">
              <div className="bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center">
                  <Trophy size={32} className="text-white mb-2" />
                  <span className="font-black text-4xl text-white tracking-widest drop-shadow-lg">GANADOR</span>
                  <div className="text-5xl font-mono font-black tracking-widest text-white my-3">
                      {sticker.numbers}
                  </div>
                  <div className="text-2xl font-bold text-white mb-3">{formatMoney(prizeAmount)}</div>
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded text-sm font-mono font-bold text-white">{sticker.code}</span>
              </div>
          </div>
      </div>
    )
  }

  const ticketBorder = isPending 
      ? (sticker.is_supercharged ? 'border-amber-400/30' : 'border-yellow-500/30') 
      : (sticker.is_supercharged ? 'border-amber-400' : 'border-brand-500/30');

  const ticketHeader = isPending
      ? (sticker.is_supercharged ? 'from-amber-500 to-amber-400' : 'from-yellow-600 to-yellow-500')
      : (sticker.is_supercharged ? 'from-amber-500 to-amber-400' : 'from-brand-600 via-brand-500 to-brand-400');

  return (
      <div key={sticker.id} className="group relative">
          <div className={`bg-navy-card rounded-2xl border ${ticketBorder} overflow-hidden shadow-lg transition-transform active:scale-[0.98]`}>
              <div className={`p-1 relative overflow-hidden bg-gradient-to-r ${ticketHeader}`}>
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
                      <div className="flex items-center gap-2 mb-2">
                          <div className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Zap size={8} fill="currentColor"/> Diario
                          </div>
                          <div className="text-[9px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star size={8} fill="currentColor"/> Semanal
                          </div>
                      </div>
                      <div className={`text-5xl font-mono font-black tracking-widest ${isPending ? 'text-yellow-500' : (sticker.is_supercharged ? 'text-amber-400' : 'text-white')} group-hover:text-brand-400 transition-colors shadow-black drop-shadow-sm`}>
                          {sticker.numbers}
                      </div>
                      <div className="text-slate-400 font-bold text-lg mt-1">{formatMoney(sticker.price)}</div>
                      <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar size={10}/> {new Date(sticker.purchasedAt).toLocaleDateString()} {new Date(sticker.purchasedAt).toLocaleTimeString()}
                      </div>
                  </div>
                  
                  <div className="bg-white/10 p-1.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] opacity-80 flex flex-col items-center justify-center w-[80px] h-[80px]">
                      {isPending ? (
                           <div className="relative w-full h-full">
                              {paymentOptionsVisible === sticker.id ? (
                                  <div className='absolute inset-0 bg-navy-800 rounded-lg p-1.5 flex flex-col gap-1.5 z-10 animate-in fade-in duration-300'>
                                      <button onClick={() => setPaymentOptionsVisible(null)} className='absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 z-20'><X size={12}/></button>
                                      <button 
                                          onClick={() => onPayWithWallet(sticker)} 
                                          disabled={loading || walletBalance < sticker.price}
                                          className='w-full flex-1 bg-green-500 text-navy-950 rounded-md text-[10px] font-black disabled:bg-gray-500 disabled:opacity-50'
                                      >CON SALDO</button>
                                      <button onClick={() => onPayWithMercadoPago(sticker)} className='w-full flex-1 bg-blue-500 text-white rounded-md text-[10px] font-black'>MERCADO PAGO</button>
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
          {sticker.is_supercharged && settings?.superchargePrizeImage && (
              <img 
                  src={settings.superchargePrizeImage} 
                  alt="Potenciado" 
                  className="absolute -top-5 -right-5 w-24 h-auto transform rotate-[15deg] drop-shadow-lg pointer-events-none"
              />
          )}
      </div>
  );
}
