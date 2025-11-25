import React from 'react';
import { ArrowRight, HelpCircle, Key, Lock, Phone } from 'lucide-react';

interface Props {
  step: 'phone' | 'code';
  phone: string;
  setPhone: (phone: string) => void;
  accessCode: string;
  setAccessCode: (code: string) => void;
  loginError: string;
  loading: boolean;
  handlePhoneSubmit: (e: React.FormEvent) => void;
  handleCodeSubmit: (e: React.FormEvent) => void;
  contactAdmin: () => void;
  setStep: (step: 'phone' | 'code') => void;
  setLoginError: (error: string) => void;
}

export const Login: React.FC<Props> = ({ 
    step, phone, setPhone, accessCode, setAccessCode, loginError, loading, 
    handlePhoneSubmit, handleCodeSubmit, contactAdmin, setStep, setLoginError
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-4 space-y-6 animate-in fade-in duration-500">
         <div className="w-20 h-20 rounded-2xl bg-navy-card border border-white/10 flex items-center justify-center shadow-glow">
              <Lock className="text-brand-500" size={32} />
         </div>
         <div className="text-center">
             <h2 className="text-2xl font-bold text-white">Mis Tickets</h2>
             <p className="text-slate-400 text-sm">Acceso seguro a tu bóveda personal.</p>
         </div>
         
         {step === 'phone' ? (
             <form onSubmit={handlePhoneSubmit} className="w-full space-y-4">
                  <div className="relative">
                      <Phone size={18} className="absolute left-3 top-3.5 text-slate-500" />
                      <input 
                          type="tel" 
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="Número de WhatsApp"
                          className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-10 text-white text-center text-lg focus:border-brand-500 outline-none"
                      />
                  </div>
                  {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                  <button disabled={loading} className="w-full bg-brand-500 text-navy-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                       {loading ? <div className='w-5 h-5 border-2 border-navy-950 rounded-full border-t-transparent animate-spin'></div> : <>CONTINUAR <ArrowRight size={18}/></>}
                  </button>
             </form>
         ) : (
             <form onSubmit={handleCodeSubmit} className="w-full space-y-4">
                  <div className="relative">
                      <Key size={18} className="absolute left-3 top-3.5 text-slate-500" />
                      <input 
                          type="text" 
                          value={accessCode}
                          onChange={e => setAccessCode(e.target.value)}
                          placeholder="Código de Acceso (6 dígitos)"
                          className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-10 text-white text-center text-lg focus:border-brand-500 outline-none tracking-widest"
                      />
                  </div>
                  {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
                  
                  <button disabled={loading} className="w-full bg-brand-500 text-navy-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                      {loading ? <div className='w-5 h-5 border-2 border-navy-950 rounded-full border-t-transparent animate-spin'></div> : 'ENTRAR AHORA'}
                  </button>

                  <button 
                      type="button"
                      onClick={contactAdmin}
                      className="w-full text-slate-500 text-xs flex items-center justify-center gap-1 hover:text-white mt-4"
                  >
                      <HelpCircle size={12} /> No tengo código / Solicitar al Admin
                  </button>
                  <button 
                      type="button"
                      onClick={() => { setStep('phone'); setLoginError(''); }}
                      className="w-full text-brand-500 text-xs mt-2"
                  >
                      Cambiar número
                  </button>
             </form>
         )}
    </div>
  );
};