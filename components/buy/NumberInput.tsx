
import React from 'react';
import { Dices, Trash2, Keyboard } from 'lucide-react';

interface Props {
  numbers: string;
  loading: boolean;
  error: string | null;
  onInput: (num: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onRandom: () => void;
}

export const NumberInput: React.FC<Props> = ({
  numbers,
  loading,
  error,
  onInput,
  onDelete,
  onClear,
  onRandom,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto">
      {numbers.length < 4 ? (
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => onInput(num.toString())}
              disabled={loading}
              className="bg-navy-700 hover:bg-navy-600 text-xl font-bold py-2.5 rounded-lg transition-all text-white active:bg-navy-500"
            >
              {num}
            </button>
          ))}
          <button onClick={onDelete} className="bg-navy-700 text-red-400/80 font-bold py-2.5 rounded-lg flex items-center justify-center hover:text-red-400 active:bg-navy-500"><Trash2 size={22} /></button>
          <button onClick={() => onInput('0')} disabled={loading} className="bg-navy-700 hover:bg-navy-600 text-xl font-bold py-2.5 rounded-lg transition-all text-white active:bg-navy-500">0</button>
          <button
            onClick={onRandom}
            disabled={loading}
            className="bg-navy-700 hover:bg-navy-600 text-amber-400 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
          >
            <Dices size={16} /> {loading ? '...' : 'Generar'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <button onClick={onClear} className="text-slate-400 font-bold p-2.5 rounded-lg flex items-center justify-center hover:text-white transition-colors text-[10px] uppercase gap-1"><Keyboard size={14} /> Digitar</button>
            <span className="text-slate-600">|</span>
            <button onClick={onRandom} className="text-amber-400/80 font-bold p-2.5 rounded-lg flex items-center justify-center hover:text-amber-400 transition-colors text-[10px] uppercase gap-1"><Dices size={14} /> Generar</button>
          </div>
        </div>
      )}
    </div>
  );
};
