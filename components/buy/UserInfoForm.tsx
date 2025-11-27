
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Phone } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSubmit: (name: string, phone: string) => void;
  loading: boolean;
  error: string | null;
  initialName: string;
  initialPhone: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
}

export const UserInfoForm: React.FC<Props> = ({
  onBack,
  onSubmit,
  loading,
  error,
  initialName,
  initialPhone,
  countryCode,
  onCountryCodeChange,
}) => {
  const [userName, setUserName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);

  const handleSubmit = () => {
    onSubmit(userName, phone);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-300 h-full flex flex-col px-4">
      <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-bold">
        <ArrowLeft size={16} /> Volver a Números
      </button>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">Tus Datos</h2>
        <p className="text-slate-400 text-xs">Necesarios para vincular tu ticket</p>
      </div>

      <div className="space-y-4 bg-navy-900 p-5 rounded-2xl border border-white/5">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nombre Completo</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              required
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-amber-500 outline-none"
              placeholder="Tu nombre"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">WhatsApp / Celular</label>
          <div className="flex gap-2">
            <div className="relative w-24 shrink-0">
              <span className="absolute left-2 top-3.5 text-slate-500 text-xs">+</span>
              <input
                type="text"
                value={countryCode}
                onChange={e => onCountryCodeChange(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-6 text-white text-sm text-center focus:border-amber-500 outline-none"
              />
            </div>
            <div className="relative flex-1">
              <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-amber-500 outline-none"
                placeholder="Número"
              />
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Usaremos este número para que veas tus tickets.</p>
        </div>
      </div>

      {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!userName || !phone || loading}
        className="w-full bg-amber-500 hover:bg-amber-400 text-navy-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Generando Ticket...' : <>CONTINUAR <ArrowRight size={20} /></>}
      </button>
    </div>
  );
};
