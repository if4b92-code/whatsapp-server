
import React, { useState, ChangeEvent, FormEvent, ReactNode, useEffect } from 'react';
import { supabase } from '../../services/client';
import { Lock } from 'lucide-react';

interface AdminLayoutProps {
  isAuthenticated: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: 'sales' | 'users' | 'sellers' | 'config' | 'lotteries' | 'movements') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  isAuthenticated,
  onLoginSuccess,
  onLogout,
  children,
  activeTab,
  setActiveTab
}) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
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
      onLoginSuccess();
    }
  };

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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <button onClick={onLogout} className="text-xs text-red-400 font-bold px-3 py-1 bg-red-500/10 rounded-lg">Salir</button>
      </div>

      <div className="bg-navy-900 p-1 rounded-xl flex overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('sales')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'sales' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Ventas</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'users' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Usuarios</button>
        <button onClick={() => setActiveTab('sellers')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'sellers' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Vendedores</button>
        <button onClick={() => setActiveTab('lotteries')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'lotteries' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Loterías</button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'config' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Ajustes</button>
        <button onClick={() => setActiveTab('movements')} className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeTab === 'movements' ? 'bg-brand-500 text-navy-950' : 'text-slate-400'}`}>Movimientos</button>
      </div>
      {children}
    </div>
  );
};
