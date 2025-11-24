
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { dbService } from '../services/db';
import { Sticker, GlobalSettings } from '../types';
import { Lock, Save, AlertTriangle, Search, Award, DollarSign, Gift, Users, Key, CheckCircle2, MessageCircle, CreditCard, Wallet, PlusCircle } from 'lucide-react';
import { supabase } from '../services/client';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [topBuyers, setTopBuyers] = useState<{docId: string, name: string, count: number}[]>([]);
  
  const [activeTab, setActiveTab] = useState<'sales' | 'users' | 'top_buyers' | 'config' | 'lotteries'>('sales');
  const [loading, setLoading] = useState(false);
  const [raffleWinner, setRaffleWinner] = useState<Sticker | null>(null);
  const [rafflePrize, setRafflePrize] = useState(0);

  const [userCodes, setUserCodes] = useState<Record<string, string>>({});
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
    const [amountToAdd, setAmountToAdd] = useState<Record<string, string>>({}); 
    const [showShield, setShowShield] = useState(false);
    const [userInput, setUserInput] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setUserInput(prev => {
                const newUserInput = prev + e.key;
                if (newUserInput === 'amor') {
                    setShowShield(true);
                    return newUserInput;
                }
                return newUserInput.length > 4 ? e.key : newUserInput;
            });
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Acceso Denegado');
    } else {
      setIsAuthenticated(true);
      await loadData();
    }
  };

  const loadData = async () => {
    setLoading(true);
    const s = await dbService.getAllStickersGlobal();
    const set = await dbService.getSettings();
    const buyers = await dbService.getTopBuyers();
    
    const phones = new Set(s.map(sticker => sticker.ownerData.phone));
    
    const balances: Record<string, number> = {};
    for (const p of Array.from(phones)) {
        const bal = await dbService.getWalletBalance(p);
        balances[p] = bal;
    }

    // Sort stickers by date in descending order
    const sortedStickers = s.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    
    setStickers(sortedStickers);
    setSettings(set);
    setTopBuyers(buyers);
    setUserBalances(balances);
    setLoading(false);
  };

  const handleUpdateSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (settings) {
        await dbService.updateSettings(settings);
        alert("Guardado correctamente");
    }
  };

  const handleWhatsAppClick = (sticker: Sticker) => {
      if (!sticker.ownerData.phone) return;
      
      const cleanPhone = sticker.ownerData.phone.replace(/\+/g, '');
      const message = `Hola ${sticker.ownerData.fullName}, confirmamos tu compra en GanarApp. Tu ticket es: ${sticker.numbers} (Código: ${sticker.code}). ¡Mucha suerte!`;
      
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };
  
  const handleManualApproval = async (e: React.MouseEvent, sticker: Sticker) => {
      e.preventDefault();
      e.stopPropagation(); 

      if (window.confirm(`¿Confirmar pago MANUAL del ticket #${sticker.numbers}?`)) {
          const success = await dbService.approveTicketManually(sticker.id);
          if (success) {
              alert("✅ Ticket marcado como PAGADO.");
              await loadData(); // Refresh data immediately
          } else {
              alert("❌ Error al actualizar ticket.");
          }
      }
  };

  const handleAddBalance = async (phone: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      const rawAmount = amountToAdd[phone] || '0';
      const amount = parseInt(rawAmount);

      if (!isNaN(amount) && amount > 0) {
          if(window.confirm(`¿Agregar $${amount} a la billetera de ${phone}?`)) {
              await dbService.addWalletBalance(cleanPhone, amount);
              
              setAmountToAdd(prev => ({ ...prev, [phone]: '' }));
              
              alert("Saldo agregado correctamente");
              await loadData();
          }
      }
  };

  const runInternalRaffle = () => {
      if (!stickers.length || !settings) return;
      
      const activeStickers = stickers.filter(s => s.status === 'active');
      if (activeStickers.length === 0) {
          alert("No hay tickets pagados para sortear.");
          return;
      }

      const totalSales = activeStickers.length * settings.ticketPrice;
      const prizePool = totalSales * 0.25;
      
      const randomIndex = Math.floor(Math.random() * activeStickers.length);
      const winner = activeStickers[randomIndex];

      setRaffleWinner(winner);
      setRafflePrize(prizePool);
  };

  const handleGenerateCode = async (phone: string, name: string) => {
      const code = await dbService.generateUserAccessCode(phone);
      setUserCodes(prev => ({ ...prev, [phone]: code }));
      
      const cleanPhone = phone.replace(/\+/g, '');
      const message = `Hola ${name}, tu Código de Acceso Seguro para ver tus tickets en GanarApp es: *${code}*. No lo compartas.`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const uniqueUsers = (Array.from(new Set(stickers.map(s => s.ownerData.phone))) as string[])
    .map(phone => {
        const userStickers = stickers.filter(s => s.ownerData.phone === phone);
        const lastSticker = userStickers[0];
        return {
            phone,
            name: lastSticker?.ownerData.fullName || 'Usuario',
            ticketsCount: userStickers.length,
            lastActive: lastSticker?.purchasedAt || ''
        };
    });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 px-6">
       <div className={`w-20 h-20 rounded-2xl bg-navy-card border border-white/10 flex items-center justify-center shadow-glow ${showShield ? '' : 'hidden'}`}>
            <Lock className="text-brand-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">Acceso Admin</h2>
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-600 text-center tracking-widest"
          />
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Contraseña maestra"
            className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-600 text-center tracking-widest"
          />
          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
          <button className="w-full bg-white text-navy-950 font-bold py-4 rounded-xl uppercase tracking-wider hover:bg-slate-200">Entrar</button>
        </form>
      </div>
    );
  }

  if (loading || !settings) {
      return <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;
  }

  const activeTickets = stickers.filter(s => s.status === 'active');
  const totalSales = activeTickets.length * settings.ticketPrice;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <button onClick={() => setIsAuthenticated(false)} className="text-xs text-red-400 font-bold px-3 py-1 bg-red-500/10 rounded-lg">Salir</button>
      </div>

      <div className="bg-navy-900 p-1 rounded-xl flex overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('sales')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'sales' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Ventas</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'users' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Usuarios</button>
        <button onClick={() => setActiveTab('top_buyers')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'top_buyers' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Líderes</button>
        <button onClick={() => setActiveTab('lotteries')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'lotteries' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Loterías</button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'config' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Ajustes</button>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-3">
             <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                 <h3 className="text-purple-400 font-bold text-xs uppercase mb-2 flex items-center gap-2"><Gift size={16}/> Sorteo Interno (25% Recaudo)</h3>
                 <p className="text-slate-400 text-xs mb-3">Premio: <b className="text-white">{formatMoney(totalSales * 0.25)}</b></p>
                 
                 {!raffleWinner ? (
                    <button type="button" onClick={runInternalRaffle} className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-lg text-xs font-bold w-full transition-colors">
                        EJECUTAR SORTEO
                    </button>
                 ) : (
                     <div className="bg-navy-900 p-3 rounded-lg border border-purple-500/50">
                         <div className="text-xs text-purple-400 font-bold uppercase">¡Ganador Seleccionado!</div>
                         <div className="text-white font-bold text-lg">{raffleWinner.numbers}</div>
                         <div className="text-xs text-slate-400">{raffleWinner.ownerData.fullName}</div>
                         <div className="mt-2 text-green-400 font-black text-xl">{formatMoney(rafflePrize)}</div>
                         <button onClick={() => setRaffleWinner(null)} className="text-[10px] text-slate-500 underline mt-2">Reiniciar</button>
                     </div>
                 )}
             </div>

            {stickers.map(s => (
                <div key={s.id} className={`flex justify-between items-center p-4 bg-navy-card rounded-xl border ${s.status === 'active' ? 'border-green-500/20' : 'border-white/5 opacity-70'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold border border-white/5 bg-brand-500/20 text-brand-400">
                            {String(s.numbers).slice(0,2)}
                        </div>
                        <div>
                            <div className="font-mono font-bold text-white text-lg tracking-widest">{s.numbers}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{s.code}</div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                         <div className="text-[10px] text-slate-400">{s.ownerData ? s.ownerData.fullName : 'Sin registrar'}</div>
                         <div className={`text-[9px] font-bold uppercase px-1 rounded ${s.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                             {s.status === 'active' ? 'PAGADO' : 'PENDIENTE'}
                         </div>
                         
                         <div className="flex gap-1 mt-1 relative z-10">
                             {s.status === 'pending' && (
                                 <button
                                     type="button"
                                     onClick={(e) => handleManualApproval(e, s)}
                                     className="bg-yellow-500 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-yellow-400 transition-colors shadow-lg flex items-center gap-1 cursor-pointer"
                                     title="Marcar como Pagado"
                                 >
                                     <CheckCircle2 size={12} /> APROBAR
                                 </button>
                             )}
                             {s.ownerData?.phone && (
                                 <button 
                                    type="button"
                                    onClick={() => handleWhatsAppClick(s)} 
                                    className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-2 rounded-full transition-colors cursor-pointer"
                                >
                                     <MessageCircle size={18} />
                                 </button>
                             )}
                         </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'users' && (
          <div className="space-y-4">
              <h3 className="text-brand-400 font-bold uppercase text-sm flex items-center gap-2">
                  <Users size={18} /> Usuarios y Billetera
              </h3>
              
              {uniqueUsers.map((user) => (
                  <div key={user.phone} className="bg-navy-card p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-white font-bold text-sm">{user.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{user.phone}</div>
                              <div className="text-[10px] text-slate-500 mt-1">{user.ticketsCount} Tickets</div>
                          </div>
                          <div className="text-right">
                              <div className="text-green-400 font-mono font-black text-lg">
                                  {formatMoney(userBalances[user.phone] || 0)}
                              </div>
                              <div className="text-[9px] text-slate-500 uppercase font-bold">Saldo Billetera</div>
                          </div>
                      </div>

                      <div className="flex gap-2 items-center bg-navy-900 p-2 rounded-lg border border-white/5">
                          <Wallet size={14} className="text-slate-500" />
                          <input 
                             type="number" 
                             placeholder="Monto a cargar" 
                             value={amountToAdd[user.phone] || ''}
                             onChange={(e) => setAmountToAdd(prev => ({ ...prev, [user.phone]: e.target.value }))}
                             className="bg-transparent text-white text-xs w-full outline-none placeholder:text-slate-600"
                          />
                          <button 
                             onClick={() => handleAddBalance(user.phone)}
                             className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded shadow-lg"
                             disabled={!amountToAdd[user.phone]}
                          >
                              <PlusCircle size={16} />
                          </button>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500">Clave de Acceso:</span>
                        <button 
                            onClick={() => handleGenerateCode(user.phone, user.name)}
                            className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1"
                        >
                            <Key size={12} />
                            {userCodes[user.phone] ? `REENVIAR: ${userCodes[user.phone]}` : 'GENERAR CLAVE'}
                        </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'top_buyers' && (
          <div className="space-y-4">
              {topBuyers.map((buyer, idx) => (
                  <div key={buyer.docId} className="bg-navy-card p-4 rounded-xl border border-white/5 flex items-center justify-between relative overflow-hidden">
                      {idx === 0 && <div className="absolute top-0 left-0 bg-brand-500 text-navy-950 text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">LÍDER</div>}
                      <div className="flex items-center gap-3 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center font-bold text-white border border-white/10">
                              {idx + 1}
                          </div>
                          <div>
                              <div className="text-white font-bold text-sm">{buyer.name}</div>
                              <div className="text-xs text-slate-500">C.C. {buyer.docId}</div>
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-2xl font-black text-brand-400">{buyer.count}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Tickets</div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'config' && (
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
      )}

      {activeTab === 'lotteries' && (
          <div className="space-y-2">
          </div>
      )}
    </div>
  );
};
