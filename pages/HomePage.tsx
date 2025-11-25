
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { GlobalSettings, LotterySchedule } from '../types';
import { Trophy, ChevronRight, Info, Clover, Star, Users, Heart, Zap } from 'lucide-react';

interface Props {
  onBuyClick: (price: number, isSupercharged: boolean) => void;
}

export const HomePage: React.FC<Props> = ({ onBuyClick }) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [dailyLottery, setDailyLottery] = useState<LotterySchedule | null>(null);
  const [saturdayLottery, setSaturdayLottery] = useState<LotterySchedule | null>(null);
  const [isSuperchargeActive, setIsSuperchargeActive] = useState(false);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  useEffect(() => {
    const loadData = async () => {
        const s = await dbService.getSettings();
        setSettings(s);
        
        const schedule = await dbService.getLotterySchedule();
        const today = new Date();
        let dayOfWeek = today.getDay(); // Sunday is 0
        
        if (dayOfWeek === 0) {
            dayOfWeek = 1;
        }

        const dailyEntry = schedule.find(item => item.day === dayOfWeek);
        if (dailyEntry) {
            setDailyLottery(dailyEntry);
        }
        
        const saturdayEntry = schedule.find(item => item.day === 6);
        if (saturdayEntry) {
            setSaturdayLottery(saturdayEntry);
        }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!settings) return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-amber-400 rounded-full border-t-transparent"></div></div>;

  const currentTicketPrice = isSuperchargeActive 
    ? settings.ticketPrice * (settings.superchargeMultiplier || 1) 
    : settings.ticketPrice;

  return (
    <div className="space-y-8">
      
      {/* --- SUPERCHARGE SECTION --- */}
      {settings.superchargePrizeName && (
        <div
          onClick={() => setIsSuperchargeActive(!isSuperchargeActive)}
          className={`rounded-2xl p-4 border-2 transition-all duration-300 ease-in-out cursor-pointer group ${
            isSuperchargeActive
              ? 'border-amber-400 bg-amber-900/20 shadow-[0_0_40px_rgba(250,204,21,0.3)]'
              : 'border-navy-700 bg-navy-800/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center">
            {settings.superchargePrizeImage && (
                <img src={settings.superchargePrizeImage} alt={settings.superchargePrizeName} className="w-24 h-auto rounded-md shadow-lg mr-4" />
            )}
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <Zap size={20} className={`transition-colors ${isSuperchargeActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-500'}`} />
                <h2 className="text-lg font-bold text-white">
                  Activar Supercharge x{settings.superchargeMultiplier}
                </h2>
              </div>
              <p className="text-sm text-slate-400 pl-8">
                ¡Participa por la <strong>{settings.superchargePrizeName}</strong> y más!
              </p>
              <p className="text-xs text-amber-400/80 font-semibold pl-8 mt-1">
                (Juega el Sábado con el Acumulado)
              </p>
            </div>
            <div className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${isSuperchargeActive ? 'bg-amber-400' : 'bg-navy-700'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${isSuperchargeActive ? 'translate-x-6' : 'translate-x-0'}`}/>
            </div>
          </div>
          {isSuperchargeActive && (
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-300 font-medium">¡Genial! Con Supercharge activado, el valor de tu ticket es de <b className="text-white">{formatMoney(currentTicketPrice)}</b> y participas por premios increíbles.</p>
            </div>
          )}
        </div>
      )}

      {/* --- MAIN HERO CARD --- */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-t from-amber-500 to-blue-600 rounded-[30px] opacity-30 blur-xl"></div>
        <div className="relative bg-navy-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-navy-800/50">
            
            <div className="bg-amber-400 p-2 text-center shadow-lg relative z-10">
                <h1 className="text-slate-900 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <Star size={14} className="text-slate-900/50" />
                    ¡4 OPORTUNIDADES DE APOYAR!
                    <Star size={14} className="text-slate-900/50" />
                </h1>
            </div>

            <div className="p-6 flex flex-col items-center text-center relative z-10">
                
                <div className="mb-6 w-full">
                    <div className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mb-1">Gran Ticket de Oro Semanal</div>
                    <div className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] font-mono">
                        {formatMoney(settings.jackpotAmount)}
                    </div>
                    <div className="text-sm font-bold text-green-300 bg-green-500/10 px-3 py-1 rounded-full inline-block mt-2 border border-green-500/20">
                        + {formatMoney(settings.accumulatedPool)} Donación al Azar
                    </div>
                </div>

                <button 
                    onClick={() => onBuyClick(currentTicketPrice, isSuperchargeActive)}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg py-4 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all active:scale-[0.97] flex items-center justify-between px-6"
                >
                    <span>COMPRAR TICKET</span>
                    <span className="flex items-center gap-2">
                      <span className="bg-slate-900/20 px-3 py-1 rounded-md text-sm font-mono">{formatMoney(currentTicketPrice)}</span>
                      <ChevronRight strokeWidth={4} size={22} />
                    </span>
                </button>
            </div>
        </div>
      </div>

      {/* --- 4 WAYS TO WIN GRID --- */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
              <h2 className="text-white font-bold text-xl tracking-wide">¿CÓMO GANO?</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Afortudiario */}
            <div className="bg-navy-card rounded-2xl p-4 border border-blue-500/30 relative overflow-hidden group hover:border-blue-400/60 transition-colors shadow-lg">
               <div className="absolute right-[-10px] top-[-10px] text-blue-600/10 group-hover:text-blue-500/15 transition-colors group-hover:scale-110">
                  <Clover size={64} strokeWidth={1.5} />
               </div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-3">
                      <Clover size={24} />
                  </div>
                  <h3 className="text-blue-200 font-bold text-sm mb-1">1. Afortudiario</h3>
                  <div className="text-2xl font-black text-white font-mono mt-auto">{formatMoney(settings.dailyPrizeAmount)}</div>
                  {dailyLottery && 
                    <p className="text-[10px] text-slate-400 mt-2">
                        Juega {new Date().getDay() === 0 ? 'MAÑANA' : 'HOY'} con <b className="text-blue-300">{dailyLottery.lottery_name}</b> a las {dailyLottery.lottery_time}. Tu número juega TODA la semana.
                    </p>
                  }
               </div>
            </div>

            {/* 2. Ticket de Oro */}
            <div className="bg-navy-card rounded-2xl p-4 border border-amber-500/30 relative overflow-hidden group hover:border-amber-400/60 transition-colors shadow-lg">
               <div className="absolute right-[-10px] top-[-10px] text-amber-600/10 group-hover:text-amber-500/15 transition-colors group-hover:scale-110">
                  <Trophy size={64} strokeWidth={1.5}/>
               </div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3">
                      <Star size={24} />
                  </div>
                  <h3 className="text-amber-200 font-bold text-sm mb-1">2. Ticket de Oro</h3>
                  <div className="text-2xl font-black text-white font-mono mt-auto">{formatMoney(settings.jackpotAmount)}</div>
                  {saturdayLottery && <p className="text-[10px] text-slate-400 mt-2">Juega el Sábado con la <b className="text-amber-300">{saturdayLottery.lottery_name}</b> a las {saturdayLottery.lottery_time}.</p>}
               </div>
            </div>

            {/* 3. El Elegido */}
            <div className="bg-navy-card rounded-2xl p-4 border border-purple-500/30 relative overflow-hidden group hover:border-purple-400/60 transition-colors shadow-lg">
               <div className="absolute right-[-10px] top-[-10px] text-purple-600/10 group-hover:text-purple-500/15 transition-colors group-hover:scale-110">
                  <Users size={64} strokeWidth={1.5} />
               </div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-3">
                      <Users size={24} />
                  </div>
                  <h3 className="text-purple-200 font-bold text-sm mb-1">3. El Elegido</h3>
                  <div className="text-xl font-black text-white leading-tight mt-auto">¡GANADOR<br/>GARANTIZADO!</div>
                  <p className="text-[10px] text-slate-400 mt-2">¡Todos los días un ganador! Oportunidad de ganar aún si no coincide tu número.</p>
               </div>
            </div>

            {/* 4. Donación al Azar */}
            <div className="bg-green-900/50 rounded-2xl p-4 border-2 border-green-500/60 relative overflow-hidden group hover:border-green-400/80 transition-colors shadow-lg">
               <div className="absolute right-[-10px] top-[-10px] text-green-600/10 group-hover:text-green-500/15 transition-colors group-hover:scale-110">
                  <Heart size={64} strokeWidth={1.5} />
               </div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-300 flex items-center justify-center mb-3">
                      <Heart size={24} />
                  </div>
                  <h3 className="text-green-200 font-bold text-sm mb-1">4. Donación al Azar</h3>
                  <div className="text-2xl font-black text-white font-mono mt-auto">{formatMoney(settings.accumulatedPool)}</div>
                  <p className="text-[10px] text-slate-300 mt-2">APOYO PARA EMPRENDEDORES. Tus donaciones impulsan sueños.</p>
               </div>
            </div>
          </div>
      </div>

      {/* Footer Legal */}
      <div className="flex gap-3 items-start p-4 bg-navy-900/50 rounded-2xl border border-white/10">
        <Info size={24} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <b>GanarApp</b> - Un solo ticket te da acceso a todo: Afortudiario, Ticket de Oro, El Elegido y Donación al Azar. ¡Mucha suerte! 
          <br/><a href="#" className="opacity-60 text-[10px] underline hover:opacity-100">Aplican Términos y Condiciones.</a>
        </p>
      </div>
    </div>
  );
};
