
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { GlobalSettings } from '../../types';
import { DollarSign, CreditCard, Save, AlertTriangle } from 'lucide-react';
import { dbService } from '../../services/db';

interface SettingsTabProps {
  initialSettings: GlobalSettings;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(initialSettings);

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (settings) {
        await dbService.updateSettings(settings);
        alert("Guardado correctamente");
    }
  };

  if (!settings) {
    return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <form onSubmit={handleUpdateSettings} className="space-y-5 bg-navy-card p-5 rounded-2xl border border-white/5">
        <div className="space-y-4 border-b border-white/10 pb-6">
           <h3 className="text-brand-400 font-bold uppercase text-sm flex items-center gap-2"><DollarSign size={16}/> Premios y Valor</h3>
           <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Precio Ticket</label>
                <input 
                    type="number" 
                    value={settings.ticketPrice} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, ticketPrice: parseInt(e.target.value) || 0} : null)} 
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-brand-500 outline-none" 
                />
           </div>
            <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Premio Diario</label>
                <input 
                    type="number" 
                    value={settings.dailyPrizeAmount} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, dailyPrizeAmount: parseInt(e.target.value) || 0} : null)} 
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-brand-500 outline-none" 
                />
           </div>
           <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Gran Acumulado</label>
                <input 
                    type="number" 
                    value={settings.jackpotAmount} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, jackpotAmount: parseInt(e.target.value) || 0} : null)} 
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-brand-500 outline-none" 
                />
           </div>
            <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Bolsa Extra</label>
                <input 
                    type="number" 
                    value={settings.accumulatedPool} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, accumulatedPool: parseInt(e.target.value) || 0} : null)} 
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-brand-500 outline-none" 
                />
           </div>
           <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Recompensa Líder</label>
                <input 
                    type="number" 
                    value={settings.topBuyerPrize} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, topBuyerPrize: parseInt(e.target.value) || 0} : null)} 
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-brand-500 outline-none" 
                />
           </div>
       </div>

       <div className="space-y-4 border-b border-white/10 pb-6">
           <h3 className="text-blue-400 font-bold uppercase text-sm flex items-center gap-2"><CreditCard size={16}/> Mercado Pago</h3>
           <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <p className="text-[10px] text-blue-200 mb-2">Access Token (Producción)</p>
                <input 
                    type="text" 
                    value={settings.mpAccessToken || ''} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, mpAccessToken: e.target.value} : null)} 
                    placeholder="APP_USR-..."
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-xs focus:border-blue-500 outline-none" 
                />
                {settings.mpAccessToken && settings.mpAccessToken.length < 50 && (
                    <div className="flex items-center gap-1 text-red-400 text-[10px] mt-1 font-bold">
                        <AlertTriangle size={10} /> Token demasiado corto. ¿Es la Public Key por error?
                    </div>
                )}
           </div>
       </div>
       
       <button className="w-full bg-brand-500 hover:bg-brand-400 text-navy-950 font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-glow active:scale-[0.98]">
           <Save size={20} /> GUARDAR TODO
       </button>
   </form>
  );
};
