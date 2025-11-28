
import React, { useMemo } from 'react';
import { Sticker } from '../../types';

interface Props {
  sales: Sticker[];
}

interface SellerStats {
  totalSales: number;
  totalCommission: number;
  sales: Sticker[];
}

export const SellersTab: React.FC<Props> = ({ sales }) => {

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const sellerData = useMemo(() => {
    const data: Record<string, SellerStats> = {};
    sales.forEach(sale => {
      if (!sale.seller_phone) return;
      if (!data[sale.seller_phone]) {
        data[sale.seller_phone] = { totalSales: 0, totalCommission: 0, sales: [] };
      }
      const commission = sale.price * 0.30;
      data[sale.seller_phone].sales.push(sale);
      data[sale.seller_phone].totalSales += sale.price;
      data[sale.seller_phone].totalCommission += commission;
    });
    return data;
  }, [sales]);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Ventas por Vendedor</h3>
      {Object.entries(sellerData).map(([sellerPhone, stats]) => (
        <div key={sellerPhone} className="bg-navy-900 p-4 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-white">{stats.sales[0].seller_name}</h4>
              <p className="text-sm text-slate-400">{sellerPhone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Venta Total</p>
              <p className="font-bold text-white">{formatMoney(stats.totalSales)}</p>
              <p className="text-sm text-slate-400 mt-1">Comisión Total</p>
              <p className="font-bold text-green-400">{formatMoney(stats.totalCommission)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="py-3 px-4">Comprador</th>
                  <th scope="col" className="py-3 px-4">Tel. Comprador</th>
                  <th scope="col" className="py-3 px-4">Número</th>
                  <th scope="col" className="py-3 px-4">Venta</th>
                  <th scope="col" className="py-3 px-4">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {stats.sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-navy-800">
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">{sale.ownerData.fullName}</td>
                    <td className="py-3 px-4">{sale.ownerData.phone}</td>
                    <td className="py-3 px-4 font-mono">{sale.numbers}</td>
                    <td className="py-3 px-4">{formatMoney(sale.price)}</td>
                    <td className="py-3 px-4 font-bold text-green-400">{formatMoney(sale.price * 0.30)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
