
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  numbers: string;
  loading: boolean;
  error: string | null;
}

export const NumberDisplay: React.FC<Props> = ({ numbers, loading, error }) => {
  return (
    <div className={`w-full max-w-sm mx-auto flex flex-col items-center justify-center relative mb-2`}>
      <div className="flex items-center justify-center gap-1.5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-navy-700 rounded-full"></div>
            </div>
          ))
        ) : (
          [...Array(4)].map((_, i) => (
            <div key={i} className={`w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center border-2 ${error ? 'border-red-500/50' : 'border-navy-800'} shadow-inner`}>
              <span className={`text-2xl font-mono font-bold ${numbers[i] ? 'text-white' : 'text-navy-700'}`}>
                {numbers[i] || '-'}
              </span>
            </div>
          ))
        )}
      </div>
      {error && (
        <div className="absolute -bottom-5 left-0 right-0 flex items-center justify-center gap-1 text-red-400 text-[10px] font-bold">
          <AlertTriangle size={11} /> {error}
        </div>
      )}
    </div>
  );
};
