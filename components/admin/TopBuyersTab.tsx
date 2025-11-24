
import React from 'react';

interface TopBuyersTabProps {
  topBuyers: {docId: string, name: string, count: number}[];
}

export const TopBuyersTab: React.FC<TopBuyersTabProps> = ({ topBuyers }) => {
  return (
    <div className="space-y-4">
        {topBuyers.map((buyer, idx) => (
            <div key={buyer.docId} className="bg-navy-card p-4 rounded-xl border border-white/5 flex items-center justify-between relative overflow-hidden">
                {idx === 0 && <div className="absolute top-0 left-0 bg-brand-500 text-navy-950 text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">LÍDER</div>}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center font-bold text-white border border-white/10">
                        {idx + 1}
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">{buyer.name}</div>
                        <div className="text-xs text-slate-500">C.C. {buyer.docId}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-brand-400">{buyer.count}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Tickets</div>
                </div>
            </div>
        ))}
    </div>
  );
};
