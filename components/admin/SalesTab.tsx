
import React from 'react';
import { Sticker, GlobalSettings } from '../../types';
import { Gift, CheckCircle2, MessageCircle } from 'lucide-react';
import { dbService } from '../../services/db';

interface SalesTabProps {
  stickers: Sticker[];
  settings: GlobalSettings | null;
  raffleWinner: Sticker | null;
  rafflePrize: number;
  runInternalRaffle: () => void;
  setRaffleWinner: (winner: Sticker | null) => void;
  loadData: () => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({ 
    stickers, 
    settings, 
    raffleWinner, 
    rafflePrize, 
    runInternalRaffle, 
    setRaffleWinner, 
    loadData 
}) => {

    const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

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
                await loadData(); 
            } else {
                alert("❌ Error al actualizar ticket.");
            }
        }
    };

  const activeTickets = stickers.filter(s => s.status === 'active');
  const totalSales = activeTickets.length * (settings?.ticketPrice || 0);

  return (
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
  );
};
