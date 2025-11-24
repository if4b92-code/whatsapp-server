
import { Sticker, GlobalSettings, AuditLog, LotterySchedule, OwnerData } from '../types';
import { supabase, isCloudEnabled, getDeviceId, uuidv4 } from './client';

const DB_KEYS = {
  STICKERS: 'ganarapp_stickers',
  SETTINGS: 'ganarapp_settings',
  LOGS: 'ganarapp_logs',
  AUTH: 'ganarapp_auth',
  WALLETS: 'ganarapp_wallets_v2', 
};

export const COLOMBIAN_LOTTERIES: LotterySchedule[] = [
  { day: 1, dayName: 'Lunes', lotteries: ['Lotería de Cundinamarca', 'Lotería del Tolima'] },
  { day: 2, dayName: 'Martes', lotteries: ['Lotería de la Cruz Roja', 'Lotería del Huila'] },
  { day: 3, dayName: 'Miércoles', lotteries: ['Lotería de Manizales', 'Lotería del Valle', 'Lotería del Meta'] },
  { day: 4, dayName: 'Jueves', lotteries: ['Lotería de Bogotá', 'Lotería del Quindío'] },
  { day: 5, dayName: 'Viernes', lotteries: ['Lotería de Medellín', 'Lotería de Risaralda', 'Lotería de Santander'] },
  { day: 6, dayName: 'Sábado', lotteries: ['Lotería de Boyacá', 'Lotería del Cauca'] },
  { day: 0, dayName: 'Domingo', lotteries: ['Sorteo Extraordinario', 'Culona', 'Sinuano Noche'] }, 
];

// FIXED TOKEN
const FIXED_MP_TOKEN = 'APP_USR-693977690387412-042113-f4ff990c3b6759c140f6cf0df5846e4a-8148688';

const DEFAULT_SETTINGS: GlobalSettings = {
  jackpotAmount: 50000000,
  accumulatedPool: 1250000,
  dailyPrizeAmount: 200000,
  topBuyerPrize: 50000, 
  ticketPrice: 5000, 
  officialLotteryNameWeekly: "Lotería de Boyacá",
  nextDrawDateWeekly: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  mpAccessToken: FIXED_MP_TOKEN, 
  mpPublicKey: '', 
  adminWhatsApp: '573001234567'
};

// --- MEMORY STORE (CRITICAL FIX FOR PERSISTENCE) ---
// This ensures that even if LocalStorage is slow or fails, the app state is consistent in memory.
const memoryStore: Record<string, any> = {};

const getFromStorage = <T>(key: string, fallback: T): T => {
  // 1. Check Memory first (Fastest & Most recent)
  if (memoryStore[key] !== undefined) {
      return JSON.parse(JSON.stringify(memoryStore[key])); // Return copy to avoid ref issues
  }

  // 2. Check LocalStorage
  try {
    const data = localStorage.getItem(key);
    if (data) {
        const parsed = JSON.parse(data);
        memoryStore[key] = parsed; // Sync memory
        return parsed;
    }
  } catch (e) {
    console.warn("LS Read Error", e);
  }
  
  // 3. Fallback
  memoryStore[key] = fallback;
  return fallback;
};

const saveToStorage = (key: string, data: any) => {
  // 1. Update Memory
  memoryStore[key] = data;
  
  // 2. Update LocalStorage
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("LS Write Error", e);
  }
};

export const dbService = {
  getLotteryForToday: (): string => {
    const day = new Date().getDay();
    const schedule = COLOMBIAN_LOTTERIES.find(s => s.day === day);
    return schedule ? schedule.lotteries[0] : 'Sorteo Local';
  },

  getDeviceId: () => getDeviceId(),

  getSettings: async (): Promise<GlobalSettings> => {
    const stored = getFromStorage(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!stored.mpAccessToken || stored.mpAccessToken.includes('12345678')) {
        stored.mpAccessToken = FIXED_MP_TOKEN;
        saveToStorage(DB_KEYS.SETTINGS, stored);
    }
    return stored;
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>) => {
    const current = await dbService.getSettings();
    const updated = { ...current, ...newSettings };
    saveToStorage(DB_KEYS.SETTINGS, updated);
    return updated;
  },

  generateUserAccessCode: async (phone: string): Promise<string> => {
    const authDb = getFromStorage<Record<string, string>>(DB_KEYS.AUTH, {});
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    authDb[phone] = newCode;
    saveToStorage(DB_KEYS.AUTH, authDb);
    return newCode;
  },

  getUserAccessCode: async (phone: string): Promise<string | null> => {
    const authDb = getFromStorage<Record<string, string>>(DB_KEYS.AUTH, {});
    return authDb[phone] || null;
  },

  validateUserAccessCode: async (phone: string, code: string): Promise<boolean> => {
    const authDb = getFromStorage<Record<string, string>>(DB_KEYS.AUTH, {});
    return authDb[phone] === code;
  },

  // --- WALLET LOGIC (FIXED) ---

  getWalletBalance: async (phone: string): Promise<number> => {
      const wallets = getFromStorage<Record<string, number>>(DB_KEYS.WALLETS, {});
      const cleanPhone = phone.replace(/\D/g, '');
      return wallets[cleanPhone] || 0;
  },

  addWalletBalance: async (phone: string, amount: number): Promise<number> => {
      const cleanPhone = phone.replace(/\D/g, '');
      const wallets = getFromStorage<Record<string, number>>(DB_KEYS.WALLETS, {});
      
      const current = wallets[cleanPhone] || 0;
      const toAdd = Number(amount);
      
      if (isNaN(toAdd)) return current;

      const newBalance = current + toAdd;
      wallets[cleanPhone] = newBalance;
      
      saveToStorage(DB_KEYS.WALLETS, wallets);
      console.log(`[Wallet] Added ${toAdd} to ${cleanPhone}. New Balance: ${newBalance}`);
      return newBalance;
  },

  payWithWallet: async (phone: string, ticketCode: string, amount: number): Promise<{success: boolean, message: string}> => {
      const cleanPhone = phone.replace(/\D/g, '');
      const wallets = getFromStorage<Record<string, number>>(DB_KEYS.WALLETS, {});
      const currentBalance = wallets[cleanPhone] || 0;

      if (currentBalance < amount) {
          return { success: false, message: "Saldo insuficiente en billetera" };
      }

      // Deduct
      wallets[cleanPhone] = currentBalance - amount;
      saveToStorage(DB_KEYS.WALLETS, wallets);

      // Activate
      const result = await dbService.confirmTicketPayment(ticketCode);
      if (result.success) {
          return { success: true, message: "Ticket pagado con Saldo" };
      } else {
          // Rollback
          wallets[cleanPhone] = currentBalance; 
          saveToStorage(DB_KEYS.WALLETS, wallets);
          return { success: false, message: "Error activando ticket" };
      }
  },

  // --- STICKERS LOGIC ---
  
  getStickersByPhone: async (phoneNumber: string): Promise<Sticker[]> => {
    await dbService.cleanExpiredTickets();
    const all = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
    // Normalize phone search
    const searchPhone = phoneNumber.replace(/\D/g, '');
    
    return all.filter(s => {
        const p = s.ownerData.phone?.replace(/\D/g, '') || '';
        return p === searchPhone;
    }).sort((a,b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  },

  cleanExpiredTickets: async () => {
      const all = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000;
      
      const validStickers = all.filter(s => {
          if (s.status === 'pending') {
              const created = new Date(s.purchasedAt).getTime();
              return (now - created) < oneHour;
          }
          return true; 
      });

      if (validStickers.length !== all.length) {
          saveToStorage(DB_KEYS.STICKERS, validStickers);
      }
  },

  getStickerByCode: async (code: string): Promise<Sticker | null> => {
    const all = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
    return all.find(s => s.code === code) || null;
  },

  getAllStickersGlobal: async (): Promise<Sticker[]> => {
    return getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
  },

  isNumberTaken: async (numbers: string): Promise<boolean> => {
    const stickers = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
    return stickers.some(s => s.numbers === numbers && (s.status === 'active' || s.status === 'pending'));
  },

  createPendingTicket: async (numbers: string, ownerData: OwnerData): Promise<{ success: boolean, message: string, sticker?: Sticker }> => {
      if (numbers.length !== 4 || isNaN(Number(numbers))) {
        return { success: false, message: "Número inválido." };
      }

      const isTaken = await dbService.isNumberTaken(numbers);
      if (isTaken) {
          return { success: false, message: `El número ${numbers} ya está en proceso de compra o vendido.` };
      }

      const timestamp = new Date();
      const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `GA-${dateStr}-${randomPart}`; 
      const hash = btoa(`HMAC_${code}`);
      const cleanPhone = ownerData.phone.replace(/\D/g, '');

      const newSticker: Sticker = {
        id: uuidv4(), 
        code,
        numbers,
        userId: cleanPhone,
        purchasedAt: timestamp.toISOString(),
        status: 'pending', 
        hash,
        ownerData: { ...ownerData, phone: cleanPhone }
      };

      const stickers = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
      stickers.push(newSticker);
      saveToStorage(DB_KEYS.STICKERS, stickers);

      return { success: true, message: "Ticket generado", sticker: newSticker };
  },

  updateStickerOwner: async (stickerId: string, ownerData: Partial<OwnerData>) => {
      const stickers = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
      const idx = stickers.findIndex(s => s.id === stickerId);
      if (idx !== -1) {
          stickers[idx].ownerData = { ...stickers[idx].ownerData, ...ownerData } as OwnerData;
          saveToStorage(DB_KEYS.STICKERS, stickers);
      }
  },

  confirmTicketPayment: async (codeOrId: string) => {
      const stickers = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []); 
      const settings = await dbService.getSettings();
      
      const idx = stickers.findIndex(s => s.code === codeOrId || s.id === codeOrId);
      if (idx !== -1) {
          const sticker = stickers[idx];
          if (sticker.status === 'active') return { success: true, message: "Ya estaba pagado" };

          sticker.status = 'active';
          saveToStorage(DB_KEYS.STICKERS, stickers);
          
          await dbService.updateSettings({ accumulatedPool: settings.accumulatedPool + (settings.ticketPrice * 0.1) });
          
          return { success: true, message: "Ticket Activado" };
      }
      return { success: false, message: "Ticket no encontrado" };
  },

  approveTicketManually: async (stickerId: string) => {
      console.log(`[Manual Approval] Attempting to approve: ${stickerId}`);
      const stickers = getFromStorage<Sticker[]>(DB_KEYS.STICKERS, []);
      const idx = stickers.findIndex(s => s.id === stickerId);
      
      if (idx !== -1) {
          // Force update status
          stickers[idx].status = 'active';
          saveToStorage(DB_KEYS.STICKERS, stickers);
          console.log(`[Manual Approval] Status updated for ${stickerId}`);
          
          // Update pool
          const settings = getFromStorage(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
          settings.accumulatedPool += (settings.ticketPrice * 0.1);
          saveToStorage(DB_KEYS.SETTINGS, settings);
          
          return true;
      }
      console.error(`[Manual Approval] Ticket not found`);
      return false;
  },

  resetDb: () => {
    if (confirm("Solo se borrarán los datos locales.")) {
        localStorage.clear();
        window.location.reload();
    }
  },

  getTopBuyers: async (): Promise<{ docId: string, name: string, count: number }[]> => {
      const stickers = await dbService.getAllStickersGlobal();
      const counts: Record<string, { name: string, count: number }> = {};
      
      stickers.forEach(s => {
          if (s.status === 'active' && s.ownerData && s.ownerData.documentId) {
              const doc = s.ownerData.documentId;
              if (!counts[doc]) {
                  counts[doc] = { name: s.ownerData.fullName || 'Anónimo', count: 0 };
              }
              counts[doc].count++;
          }
      });

      return Object.entries(counts)
        .map(([docId, data]) => ({ docId, name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); 
  }
};
