
import React from 'react';

interface Seller {
  seller_phone: string;
  total_tickets_sold: number;
  total_commissions: number;
}

interface Props {
  sellers: Seller[];
}

export const SellersTab: React.FC<Props> = ({ sellers }) => {

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Líderes de Venta</h3>
      <div className="bg-navy-900 p-4 rounded-2xl border border-white/5">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th scope="col" className="py-3 px-6">Vendedor</th>
              <th scope="col" className="py-3 px-6">Tickets Vendidos</th>
              <th scope="col" className="py-3 px-6">Comisiones</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller, index) => (
              <tr key={index} className="border-b border-navy-800">
                <td className="py-4 px-6 font-medium text-white">{seller.seller_phone}</td>
                <td className="py-4 px-6">{seller.total_tickets_sold}</td>
                <td className="py-4 px-6 font-bold text-green-400">{formatMoney(seller.total_commissions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
