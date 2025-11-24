
import React, { useState, useEffect } from 'react';
import { Home, Ticket, ShieldCheck, Dices } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    let sequence = "";
    const handleKeyDown = (e: KeyboardEvent) => {
        sequence += e.key;
        if (sequence.length > 4) {
            sequence = sequence.substring(sequence.length - 4);
        }
        if (sequence.toLowerCase() === 'amor') {
            setShowAdmin(true);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { id: 'home', icon: Home, label: 'Lobby' },
    { id: 'buy', icon: Dices, label: 'Jugar' },
    { id: 'wallet', icon: Ticket, label: 'Mis Tickets' }, 
    { id: 'admin', icon: ShieldCheck, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header - Simplified */}
      <header className="h-16 px-4 flex items-center justify-between sticky top-0 z-50 glass border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-navy-950 flex items-center justify-center font-black italic text-lg shadow-glow">
                G
            </div>
            <span className="font-bold text-lg italic tracking-tighter">GANAR<span className="text-brand-500">APP</span></span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 py-6 scroll-smooth z-10">
        {children}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 z-50">
        <div className="glass rounded-2xl border border-white/10 shadow-2xl h-16 flex items-center justify-around px-2">
          {navItems.map((item) => {
            if (item.id === 'admin' && !showAdmin) {
                return null;
            }
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-200`}
              >
                {isActive && (
                    <div className="absolute inset-0 bg-brand-500/10 rounded-xl blur-sm"></div>
                )}
                <Icon 
                    size={24} 
                    className={`relative z-10 transition-colors ${isActive ? 'text-brand-400 fill-brand-400/20' : 'text-slate-500'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-brand-500 rounded-full"></span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
