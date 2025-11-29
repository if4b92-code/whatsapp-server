import React from 'react';
import { Ticket, Trophy, Wallet } from 'lucide-react';
import { GlobalSettings } from '../types';

interface Props {
  stickersCount: number;
  countdown: string;
  settings: GlobalSettings | null;
  walletBalance: number;
  formatMoney: (value: number) => string;
}

export const WalletHeader: React.FC<Props> = ({ stickersCount, countdown, settings, walletBalance, formatMoney }) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="text-brand-500" /> Mis Tickets <span className="text-slate-500 text-sm font-normal">({stickersCount})</span>
        </h2>
      </div>

      {/* Info */}
      <div className="bg-navy-card p-4 rounded-xl border border-white/5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-400">Próxima Retribución:</span>
          <span className="font-mono font-bold text-white">{countdown}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
            <div>
                <span className="font-bold text-slate-400">Número Acreedor:</span>
                {settings?.winningNumber && (
                    <p className="text-xs text-slate-500 font-bold">
                        {settings.winningDate || 'Hoy'} con la retribución de {(settings.winningLottery || '').replace('Lotería de ', '')}
                    </p>
                )}
            </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-mono font-bold text-2xl text-yellow-400 tracking-widest">{settings?.winningNumber || '----'}</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-4 rounded-2xl flex justify-between items-center border border-white/10">
        <div className="flex items-center gap-3">
          <Wallet size={20} className="text-green-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Saldo Billetera</span>
        </div>
        <div className="text-2xl font-mono font-black text-white">{formatMoney(walletBalance)}</div>
      </div>
    </>
  );
};