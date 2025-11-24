
import React, { useState } from 'react';
import { Sticker } from '../../types';
import { Users, Wallet, PlusCircle, Key } from 'lucide-react';
import { dbService } from '../../services/db';

interface UsersTabProps {
  stickers: Sticker[];
  userBalances: Record<string, number>;
  loadData: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ stickers, userBalances, loadData }) => {
    const [amountToAdd, setAmountToAdd] = useState<Record<string, string>>({}); 
    const [userCodes, setUserCodes] = useState<Record<string, string>>({});

    const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

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

    const handleGenerateCode = async (phone: string, name: string) => {
        const code = await dbService.generateUserAccessCode(phone);
        setUserCodes(prev => ({ ...prev, [phone]: code }));
        
        const cleanPhone = phone.replace(/\+/g, '');
        const message = `Hola ${name}, tu Código de Acceso Seguro para ver tus tickets en GanarApp es: *${code}*. No lo compartas.`;
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

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

  return (
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
  );
};
