
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Sticker, GlobalSettings } from '../types';
import { AdminLayout } from '../components/admin/AdminLayout';
import { SalesTab } from '../components/admin/SalesTab';
import { UsersTab } from '../components/admin/UsersTab';
import { TopBuyersTab } from '../components/admin/TopBuyersTab';
import { SellersTab } from '../components/admin/SellersTab';
import { LotteriesTab } from '../components/admin/LotteriesTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { MovementsTab } from '../components/admin/MovementsTab';

interface Seller {
  seller_phone: string;
  total_tickets_sold: number;
  total_commissions: number;
}

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [topBuyers, setTopBuyers] = useState<{docId: string, name: string, count: number}[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [activeTab, setActiveTab] = useState<'sales' | 'users' | 'top_buyers' | 'sellers' | 'config' | 'lotteries' | 'movements'>('sales');
  const [loading, setLoading] = useState(false);
  const [raffleWinner, setRaffleWinner] = useState<Sticker | null>(null);
  const [rafflePrize, setRafflePrize] = useState(0);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});

  const loadData = async () => {
    setLoading(true);
    const s = await dbService.getAllStickersGlobal();
    const set = await dbService.getSettings();
    const buyers = await dbService.getTopBuyers();
    const sellerData = await dbService.getSellerLeaderboard();
    
    const phones = new Set(s.map(sticker => sticker.ownerData.phone));
    
    const balances: Record<string, number> = {};
    for (const p of Array.from(phones)) {
        const bal = await dbService.getWalletBalance(p);
        balances[p] = bal;
    }

    const sortedStickers = s.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    
    setStickers(sortedStickers);
    setSettings(set);
    setTopBuyers(buyers);
    setSellers(sellerData);
    setUserBalances(balances);
    setLoading(false);
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    await loadData();
  };

  const runInternalRaffle = () => {
    if (!stickers.length || !settings) return;
    
    const activeStickers = stickers.filter(s => s.status === 'active');
    if (activeStickers.length === 0) {
        alert("No hay tickets pagados para sortear.");
        return;
    }

    const totalSales = activeStickers.length * settings.ticketPrice;
    const prizePool = totalSales * 0.25;
    
    const randomIndex = Math.floor(Math.random() * activeStickers.length);
    const winner = activeStickers[randomIndex];

    setRaffleWinner(winner);
    setRafflePrize(prizePool);
};

  return (
    <AdminLayout
      isAuthenticated={isAuthenticated}
      onLoginSuccess={handleLoginSuccess}
      onLogout={() => setIsAuthenticated(false)}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {loading ? (
        <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>
      ) : (
        <>
          {activeTab === 'sales' && 
            <SalesTab 
                stickers={stickers} 
                settings={settings} 
                raffleWinner={raffleWinner} 
                rafflePrize={rafflePrize} 
                runInternalRaffle={runInternalRaffle} 
                setRaffleWinner={setRaffleWinner} 
                loadData={loadData} 
            />}
          {activeTab === 'users' && <UsersTab stickers={stickers} userBalances={userBalances} loadData={loadData} />}
          {activeTab === 'top_buyers' && <TopBuyersTab topBuyers={topBuyers} />}
          {activeTab === 'sellers' && <SellersTab sellers={sellers} />}
          {activeTab === 'lotteries' && <LotteriesTab stickers={stickers} settings={settings} loadData={loadData} />}
          {activeTab === 'config' && settings && <SettingsTab initialSettings={settings} />}
          {activeTab === 'movements' && <MovementsTab />}
        </>
      )}
    </AdminLayout>
  );
};
