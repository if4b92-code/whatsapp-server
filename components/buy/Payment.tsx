
import React from 'react';
import { ArrowLeft, CheckCircle, Wallet, CreditCard, ArrowRight, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
  onPayWithWallet: () => void;
  onPayWithMercadoPago: () => void;
  loading: boolean;
  error: string | null;
  numbers: string;
  ticketPrice: number;
  userBalance: number;
  isSupercharged: boolean;
  formatMoney: (val: number) => string;
}

export const Payment: React.FC<Props> = ({
  onBack,
  onPayWithWallet,
  onPayWithMercadoPago,
  loading,
  error,
  numbers,
  ticketPrice,
  userBalance,
  isSupercharged,
  formatMoney,
}) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-300 h-full flex flex-col px-4">
      <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-bold">
        <ArrowLeft size={16} /> Cancelar Compra
      </button>

      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-500/20">
          <CheckCircle size={14} /> Ticket Generado
        </div>
        <h2 className="text-2xl font-bold text-white">Realizar Pago</h2>
        <div className="text-6xl font-mono font-black text-amber-400 my-2 drop-shadow-lg tracking-widest">
          {numbers}
        </div>
        <p className="text-slate-400 text-sm">Valor a pagar: <span className="text-white font-bold">{formatMoney(ticketPrice)}</span></p>
        {isSupercharged && <p className='text-xs text-amber-400 font-bold'>¡TICKET POTENCIADO! Juega el Sábado.</p>}
      </div>

      <div className="space-y-4 flex-1">
        {userBalance >= ticketPrice && (
          <button
            onClick={onPayWithWallet}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 rounded-xl h-16 transition-all active:scale-[0.98] shadow-lg flex items-center px-6 relative overflow-hidden group mb-4 border border-green-400/20"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-10 h-10 bg-navy-950/20 rounded-lg flex items-center justify-center shrink-0">
                <Wallet size={20} className="text-navy-950" />
              </div>
              <div className="text-left flex-1">
                <span className="text-navy-950 font-black text-lg block leading-tight">USAR TU SALDO</span>
                <span className="text-navy-900 font-bold text-xs">Disponible: {formatMoney(userBalance)}</span>
              </div>
              <CheckCircle size={24} className="text-navy-950 shrink-0" />
            </div>
          </button>
        )}

        <button
          onClick={onPayWithMercadoPago}
          disabled={loading}
          className="w-full bg-[#009EE3] hover:bg-[#008CC9] rounded-xl h-16 transition-all active:scale-[0.98] shadow-lg flex items-center px-6 relative overflow-hidden group"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <span className="text-white font-black text-lg block leading-tight">PAGAR CON MERCADO PAGO</span>
              <span className="text-blue-100 text-xs font-medium">PSE, Tarjetas, Nequi, Efecty</span>
            </div>
            <ArrowRight size={24} className="text-white group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
          {loading && <div className="absolute inset-0 bg-navy-950/50 z-20 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div></div>}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col gap-2 animate-pulse text-center mt-auto">
          <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
