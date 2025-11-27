
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { GlobalSettings } from '../../types';
import { DollarSign, CreditCard, Save, AlertTriangle, Zap } from 'lucide-react';
import { dbService } from '../../services/db';

interface SettingsTabProps {
  initialSettings: GlobalSettings;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(initialSettings);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const currentSettings = await dbService.getSettings();
      setSettings(currentSettings);
    };
    fetchSettings();
  }, []);

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (settings) {
        await dbService.updateSettings(settings);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const Switch = ({ checked, onChange, label, onLabel = "ON", offLabel = "OFF" }) => (
    <div className="flex items-center gap-3">
        <label className="text-xs text-slate-300 uppercase font-bold">{label}</label>
        <button 
            type="button" 
            onClick={() => onChange(!checked)}
            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors duration-200 ease-in-out ${checked ? 'bg-green-500' : 'bg-navy-700'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
        <span className={`text-[10px] font-bold ${checked ? 'text-green-400' : 'text-slate-500'}`}>
            {checked ? onLabel : offLabel}
        </span>
    </div>
  );

  if (!settings) {
    return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-brand-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <form onSubmit={handleUpdateSettings} className="space-y-5 bg-navy-card p-5 rounded-2xl border border-white/5">
        {showSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-bold p-3 rounded-lg flex items-center gap-2">
              <Zap size={16} /> ¡Configuración guardada correctamente!
          </div>
        )}
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
           <h3 className="text-purple-400 font-bold uppercase text-sm flex items-center gap-2"><Zap size={16}/> Supercarga</h3>
           <div className="space-y-2">
               <label className="text-[10px] text-slate-400 uppercase font-bold">Nombre del Premio Supercarga</label>
               <input 
                   type="text" 
                   value={settings.superchargePrizeName || ''} 
                   onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, superchargePrizeName: e.target.value} : null)} 
                   className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-purple-500 outline-none" 
               />
           </div>
           <div className="space-y-2">
               <label className="text-[10px] text-slate-400 uppercase font-bold">URL de la Imagen del Premio</label>
               <input 
                   type="text" 
                   value={settings.superchargePrizeImage || ''} 
                   onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, superchargePrizeImage: e.target.value} : null)} 
                   className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-purple-500 outline-none" 
               />
           </div>
           <div className="space-y-2">
               <label className="text-[10px] text-slate-400 uppercase font-bold">Multiplicador de Supercarga</label>
               <input 
                   type="number" 
                   value={settings.superchargeMultiplier || 0} 
                   onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, superchargeMultiplier: parseInt(e.target.value) || 0} : null)} 
                   className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-sm focus:border-purple-500 outline-none" 
               />
           </div>
       </div>

        <div className="space-y-6 border-b border-white/10 pb-6">
            <h3 className="text-cyan-400 font-bold uppercase text-sm flex items-center gap-2"><CreditCard size={16}/> Pasarelas de Pago</h3>
            
            <div className="space-y-3 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-blue-300">Mercado Pago</h4>
                    <Switch 
                        label="Estado"
                        checked={settings.mercadoPagoEnabled || false}
                        onChange={(val) => setSettings(prev => prev ? {...prev, mercadoPagoEnabled: val} : null)}
                        onLabel="ACTIVO"
                        offLabel="INACTIVO"
                    />
                </div>
                {settings.mercadoPagoEnabled && (
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mt-3 space-y-3">
                        <div>
                            <p className="text-[10px] text-blue-200 mb-1">Public Key</p>
                            <input 
                                type="text" 
                                value={settings.mpPublicKey || ''} 
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, mpPublicKey: e.target.value} : null)} 
                                placeholder="APP_USR-..."
                                className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-xs focus:border-blue-500 outline-none" 
                            />
                        </div>
                         <div>
                            <p className="text-[10px] text-blue-200 mb-1">Access Token</p>
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
                )}
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-purple-300">Wompi</h4>
                    <Switch 
                        label="Estado"
                        checked={settings.wompiEnabled || false}
                        onChange={(val) => setSettings(prev => prev ? {...prev, wompiEnabled: val} : null)}
                        onLabel="ACTIVO"
                        offLabel="INACTIVO"
                    />
                </div>
                {settings.wompiEnabled && (
                    <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 mt-3 space-y-3">
                        <div>
                            <p className="text-[10px] text-purple-200 mb-1">Public Key</p>
                            <input 
                                type="text" 
                                value={settings.wompiPublicKey || ''} 
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, wompiPublicKey: e.target.value} : null)} 
                                placeholder="pub_prod_..."
                                className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-xs focus:border-purple-500 outline-none" 
                            />
                        </div>
                         <div>
                            <p className="text-[10px] text-purple-200 mb-1">Private Key</p>
                            <input 
                                type="text" 
                                value={settings.wompiPrivateKey || ''} 
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings(prev => prev ? {...prev, wompiPrivateKey: e.target.value} : null)} 
                                placeholder="prv_prod_..."
                                className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-xs focus:border-purple-500 outline-none" 
                            />
                        </div>
                        <Switch
                            label="Modo Test"
                            checked={settings.wompiTestMode || false}
                            onChange={(val) => setSettings(prev => prev ? {...prev, wompiTestMode: val} : null)}
                            onLabel="SANDBOX"
                            offLabel="PRODUCCIÓN"
                        />
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
