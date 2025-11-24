import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { Sticker } from '../types';
import { ShieldCheck, AlertTriangle, User, Phone, FileText, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  code: string;
  onHome: () => void;
}

export const VerifyTicketPage: React.FC<Props> = ({ code, onHome }) => {
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [docId, setDocId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
        if (!code) {
            setError("Código no proporcionado");
            setLoading(false);
            return;
        }
        // This function needs to be implemented in the new db.ts
        // const s = await dbService.getStickerByCode(code);
        // if (s) {
        //     setSticker(s);
        //     if (s.ownerData) {
        //         setFullName(s.ownerData.fullName || '');
        //         setPhone(s.ownerData.phone || '');
        //         setDocId(s.ownerData.documentId || '');
        //         setSaved(true);
        //     }
        // } else {
        //     setError("Ticket Inválido o No Encontrado");
        // }
        setLoading(false);
    };
    load();
  }, [code]);

  const handleSaveOwner = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sticker) return;
      setSaving(true);
      
      const ownerData = {
          fullName,
          phone,
          documentId: docId,
          claimedAt: new Date().toISOString()
      };
      
      // This function needs to be implemented in the new db.ts
      // await dbService.updateStickerOwner(sticker.id, ownerData);
      setSaved(true);
      setSaving(false);
  };

  if (loading) return <div className="flex justify-center pt-20"><div className="animate-spin w-10 h-10 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center pt-20 px-6 text-center space-y-4">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <AlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white">Verificación Fallida</h2>
              <p className="text-slate-400">{error}</p>
              <button onClick={onHome} className="mt-8 text-brand-400 font-bold underline">Ir al Inicio</button>
          </div>
      );
  }

  if (!sticker) return null;

  return (
    <div className="min-h-screen bg-navy-950 p-6">
        
        {/* Verification Badge */}
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-4">
                <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ticket Auténtico</h1>
            <p className="text-green-400 text-sm font-bold">Verificado por GanarApp</p>
        </div>

        {/* Ticket Details */}
        <div className="bg-navy-card border border-brand-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
            <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Número Jugado</div>
                <div className="text-6xl font-black font-mono text-white tracking-[0.2em] mb-2">{sticker.numbers}</div>
                <div className="inline-block bg-navy-950/50 px-3 py-1 rounded text-xs font-mono text-slate-400 border border-white/5">
                    {sticker.code}
                </div>
            </div>
        </div>

        {/* Owner Form */}
        <div className="space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <User size={20} className="text-brand-500" /> Datos del Propietario
            </h3>
            <p className="text-xs text-slate-400 mb-4">
                Registra tus datos para que podamos contactarte si ganas y para participar automáticamente por la <span className="text-white font-bold">Recompensa Líder</span>.
            </p>

            <form onSubmit={handleSaveOwner} className="space-y-4 bg-navy-900 p-5 rounded-2xl border border-white/5">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nombre Completo</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input 
                            type="text" 
                            required 
                            disabled={saved}
                            value={fullName} 
                            onChange={e => setFullName(e.target.value)}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-brand-500 outline-none disabled:opacity-50"
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Cédula / Documento</label>
                    <div className="relative">
                        <FileText size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input 
                            type="text" 
                            required 
                            disabled={saved}
                            value={docId} 
                            onChange={e => setDocId(e.target.value)}
                            placeholder="Importante para premios extra"
                            className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-brand-500 outline-none disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Celular / WhatsApp</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        <input 
                            type="tel" 
                            required 
                            disabled={saved}
                            value={phone} 
                            onChange={e => setPhone(e.target.value)}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-brand-500 outline-none disabled:opacity-50"
                        />
                    </div>
                </div>

                {!saved ? (
                    <button disabled={saving} className="w-full bg-brand-500 hover:bg-brand-400 text-navy-950 font-black py-3 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-glow">
                        <Save size={18} /> {saving ? 'Guardando...' : 'Registrar Datos'}
                    </button>
                ) : (
                    <div className="w-full bg-green-500/10 text-green-400 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={18} /> Datos Registrados
                    </div>
                )}
            </form>
        </div>

        <div className="mt-8 text-center">
            <button onClick={onHome} className="text-slate-500 hover:text-white text-sm font-bold underline">
                Ir a la App Principal
            </button>
        </div>
    </div>
  );
};