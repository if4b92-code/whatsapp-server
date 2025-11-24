
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/mockDb';
import { GlobalSettings } from '../types';
import { Trophy, ChevronRight, Info, Calendar, Zap, Star, Users, Crown } from 'lucide-react';

interface Props {
  onBuyClick: () => void;
}

export const HomePage: React.FC<Props> = ({ onBuyClick }) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [todayLottery, setTodayLottery] = useState<string>('');

  const loadData = async () => {
      const s = await dbService.getSettings();
      setSettings(s);
      setTodayLottery(dbService.getLotteryForToday());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (!settings) return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* --- MAIN HERO CARD --- */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-brand-500 to-blue-600 rounded-[24px] opacity-75 blur-lg transition duration-1000"></div>
        <div className="relative bg-navy-900 rounded-[22px] overflow-hidden shadow-2xl">
            
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/20 via-navy-900 to-navy-950"></div>
            
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-2 text-center shadow-lg relative z-10">
                <h1 className="text-navy-950 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <Star size={12} fill="currentColor" />
                    ¡4 OPORTUNIDADES DE GANAR!
                    <Star size={12} fill="currentColor" />
                </h1>
            </div>

            <div className="p-6 flex flex-col items-center text-center relative z-10">
                
                <div className="mb-6 w-full">
                    <div className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-1">Gran Acumulado Semanal</div>
                    <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] font-mono">
                        {formatMoney(settings.jackpotAmount)}
                    </div>
                    <div className="text-xs font-bold text-green-400 font-mono bg-green-500/10 px-2 py-1 rounded inline-block mt-1">
                        + {formatMoney(settings.accumulatedPool)} Bolsa Extra
                    </div>
                </div>

                <button 
                    onClick={onBuyClick}
                    className="w-full bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-navy-950 font-black text-lg py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        COMPRAR TICKET
                        <span className="bg-navy-950/20 px-2 py-0.5 rounded text-xs font-mono">{formatMoney(settings.ticketPrice)}</span>
                    </span>
                    <ChevronRight className="relative z-10 group-hover/btn:translate-x-1 transition-transform" size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
      </div>

      {/* --- 4 WAYS TO WIN GRID --- */}
      <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
              <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">¿Cómo Gano?</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Diario */}
            <div className="bg-navy-card rounded-xl p-3 border border-blue-500/20 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
               <div className="absolute right-[-5px] top-[-5px] text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                  <Calendar size={50} />
               </div>
               <div className="relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                      <Zap size={18} fill="currentColor" />
                  </div>
                  <h3 className="text-blue-100 font-bold text-xs mb-0.5">1. Sorteo Diario</h3>
                  <div className="text-lg font-black text-white font-mono">{formatMoney(settings.dailyPrizeAmount)}</div>
                  <p className="text-[9px] text-slate-400 mt-1">Juega HOY con <b className="text-blue-300">{todayLottery}</b>.</p>
               </div>
            </div>

            {/* 2. Semanal */}
            <div className="bg-navy-card rounded-xl p-3 border border-brand-500/20 relative overflow-hidden group hover:border-brand-500/50 transition-colors">
               <div className="absolute right-[-5px] top-[-5px] text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
                  <Trophy size={50} />
               </div>
               <div className="relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center mb-2">
                      <Star size={18} fill="currentColor" />
                  </div>
                  <h3 className="text-brand-100 font-bold text-xs mb-0.5">2. Acumulado</h3>
                  <div className="text-lg font-black text-white font-mono">{formatMoney(settings.jackpotAmount)}</div>
                  <p className="text-[9px] text-slate-400 mt-1">El premio gordo de la semana.</p>
               </div>
            </div>

            {/* 3. Interno */}
            <div className="bg-navy-card rounded-xl p-3 border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
               <div className="absolute right-[-5px] top-[-5px] text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                  <Users size={50} />
               </div>
               <div className="relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                      <Users size={18} />
                  </div>
                  <h3 className="text-purple-100 font-bold text-xs mb-0.5">3. ¡Ganador Garantizado!</h3>
                  <div className="text-lg font-black text-white font-mono">Sorteo Exclusivo</div>
                  <p className="text-[9px] text-slate-400 mt-1">¡Alguien gana sí o sí cada semana!</p>
               </div>
            </div>

            {/* 4. Ranking */}
            <div className="bg-navy-card rounded-xl p-3 border border-red-500/20 relative overflow-hidden group hover:border-red-500/50 transition-colors">
               <div className="absolute right-[-5px] top-[-5px] text-red-500/10 group-hover:text-red-500/20 transition-colors">
                  <Crown size={50} />
               </div>
               <div className="relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                      <Crown size={18} />
                  </div>
                  <h3 className="text-red-100 font-bold text-xs mb-0.5">4. Recompensa Líder</h3>
                  <div className="text-lg font-black text-white font-mono">{formatMoney(settings.topBuyerPrize || 50000)}</div>
                  <p className="text-[9px] text-slate-400 mt-1">Premio automático al #1 del Ranking.</p>
               </div>
            </div>
          </div>
      </div>

      {/* Footer Legal */}
      <div className="flex gap-2 items-start p-3 bg-navy-900/50 rounded-xl border border-white/5">
        <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
          GanarApp - Un solo ticket te da acceso a todo: Premio Diario, Gran Acumulado, Sorteo Garantizado y Recompensa al Líder del Ranking. ¡Mucha suerte! 
          <br/><span className="opacity-50 text-[9px]">Aplican Términos y Condiciones.</span>
        </p>
      </div>
    </div>
  );
};
