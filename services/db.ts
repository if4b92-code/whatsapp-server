
import { Sticker, GlobalSettings, OwnerData, LotterySchedule, LotteryResult } from '../types';
import { supabase, isCloudEnabled, uuidv4 } from './client';

const DEFAULT_SETTINGS: GlobalSettings = {
  jackpotAmount: 50000000,
  accumulatedPool: 1250000,
  dailyPrizeAmount: 200000,
  topBuyerPrize: 50000, 
  ticketPrice: 5000, 
  officialLotteryNameWeekly: "Lotería de Boyacá",
  nextDrawDateWeekly: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  mpAccessToken: '', 
  mpPublicKey: '', 
  adminWhatsApp: '573001234567'
};

export const dbService = {
  addLotteryResult: async (result: LotteryResult): Promise<LotteryResult | null> => {
    if (!isCloudEnabled || !supabase) return null;

    // Manually map from JS camelCase to DB snake_case before inserting
    const dbPayload = {
      drawn_at: result.drawnAt,
      winning_number: result.winningNumber,
      prize_amount: result.prizeAmount,
      winner_info: result.winnerInfo,
    };

    const { data, error } = await supabase
      .from('lottery_results')
      .insert(dbPayload)
      .select();

    if (error) {
      console.error("Error adding lottery result:", error);
      return null;
    }
    if (!data || data.length === 0) {
        return null;
    }

    const returnedData = data[0];
    // Map back from snake_case to camelCase for the app to use
    return {
        id: returnedData.id,
        drawnAt: returnedData.drawn_at,
        winningNumber: returnedData.winning_number,
        prizeAmount: returnedData.prize_amount,
        winnerInfo: returnedData.winner_info,
    } as LotteryResult;
  },

  getLotteryHistory: async (): Promise<LotteryResult[]> => {
    if (!isCloudEnabled || !supabase) return [];

    const { data, error } = await supabase
      .from('lottery_results')
      .select('*')
      .order('drawn_at', { ascending: false }); // Use snake_case for ordering

    if (error) {
      console.error("Error fetching lottery history:", error);
      return [];
    }

    // Map results from snake_case to camelCase for the app to use
    return (data || []).map(item => ({
        id: item.id,
        drawnAt: item.drawn_at,
        winningNumber: item.winning_number,
        prizeAmount: item.prize_amount,
        winnerInfo: item.winner_info,
    })) as LotteryResult[];
  },

  getLotterySchedule: async (): Promise<LotterySchedule[]> => {
    if (!isCloudEnabled || !supabase) return [];

    const { data, error } = await supabase
      .from('lottery_schedule')
      .select('*');

    if (error) {
      console.error("Error fetching lottery schedule:", error);
      return [];
    }

    return data as LotterySchedule[];
  },

  getSettings: async (): Promise<GlobalSettings> => {
    if (!isCloudEnabled || !supabase) return DEFAULT_SETTINGS;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return DEFAULT_SETTINGS;
    }

    return data as GlobalSettings;
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>) => {
    if (!isCloudEnabled || !supabase) return;

    const { data, error } = await supabase
      .from('settings')
      .update(newSettings)
      .eq('id', 1);

    if (error) {
      console.error("Error updating settings:", error);
    }

    return data;
  },

  getWalletBalance: async (phone: string): Promise<number> => {
    if (!isCloudEnabled || !supabase) return 0;

    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.balance || 0;
  },

  addWalletBalance: async (phone: string, amount: number): Promise<number> => {
    if (!isCloudEnabled || !supabase) return 0;

    const { data, error } = await supabase.rpc('add_to_balance', { p_phone: phone, p_amount: amount });

    if (error) {
      console.error('Error adding to balance:', error);
      return 0;
    }

    return data || 0;
  },

  isNumberTaken: async (numbers: string): Promise<boolean> => {
    if (!isCloudEnabled || !supabase) return false;

    const { data, error } = await supabase
      .from('stickers')
      .select('numbers')
      .eq('numbers', numbers)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
      console.error("Error checking if number is taken:", error);
      return true; // Assume taken to be safe
    }

    return data != null;
  },
  
  payWithWallet: async (phone: string, stickerId: string, amount: number): Promise<{ success: boolean, message: string }> => {
    if (!isCloudEnabled || !supabase) return { success: false, message: "Database not connected" };

    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('phone', phone)
      .single();

    if (walletError || !walletData) {
      return { success: false, message: 'Billetera no encontrada.' };
    }

    if (walletData.balance < amount) {
      return { success: false, message: 'Saldo insuficiente.' };
    }

    const newBalance = walletData.balance - amount;
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('phone', phone);
      
    if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        return { success: false, message: 'Error al actualizar billetera.' };
    }

    const { error: updateStickerError } = await supabase
      .from('stickers')
      .update({ status: 'active', purchasedAt: new Date().toISOString() })
      .eq('id', stickerId)
      .eq('status', 'pending');

    if (updateStickerError) {
      console.error('Error activating sticker:', updateStickerError);
      await supabase.from('wallets').update({ balance: walletData.balance }).eq('phone', phone);
      return { success: false, message: 'Error al activar el ticket. Se ha devuelto el saldo.' };
    }
    
    return { success: true, message: 'Pago completado con éxito.' };
  },


  generateUserAccessCode: async (phone: string): Promise<string> => {
    if (!isCloudEnabled || !supabase) return ''

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { error } = await supabase
      .from('user_access_codes')
      .upsert({ phone, code, created_at: new Date().toISOString() });

    if (error) {
      console.error("Error generating access code:", error);
      return '';
    }

    return code;
  },

  validateUserAccessCode: async (phone: string, code: string): Promise<boolean> => {
    if (!isCloudEnabled || !supabase) return false;

    const { data, error } = await supabase
      .from('user_access_codes')
      .select('code')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return false;
    }

    return data.code === code;
  },

  getAllStickersGlobal: async (): Promise<Sticker[]> => {
    if (!isCloudEnabled || !supabase) return [];

    const { data, error } = await supabase
      .from('stickers')
      .select('*');

    if (error) {
      console.error("Error fetching stickers:", error);
      return [];
    }

    return data as Sticker[];
  },

    getStickersByPhone: async (phoneNumber: string): Promise<Sticker[]> => {
    if (!isCloudEnabled || !supabase) return [];

    const { data, error } = await supabase
      .from('stickers')
      .select('*')
      .eq('userId', phoneNumber);

    if (error) {
      console.error("Error fetching stickers:", error);
      return [];
    }

    return data as Sticker[];
  },

  getTopBuyers: async (): Promise<{ docId: string, name: string, count: number }[]> => {
    if (!isCloudEnabled || !supabase) return [];

    const { data, error } = await supabase.rpc('get_top_buyers');

    if (error) {
      console.error('Error getting top buyers:', error);
      return [];
    }
    return data || [];
  },

  createPendingTicket: async (numbers: string, ownerData: OwnerData): Promise<{ success: boolean, message: string, sticker?: Sticker }> => {
    if (!isCloudEnabled || !supabase) return { success: false, message: "Database not connected" };

    if (numbers.length !== 4 || isNaN(Number(numbers))) {
      return { success: false, message: "Número inválido." };
    }

    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `GA-${dateStr}-${randomPart}`;
    const hash = btoa(`HMAC_${code}`);

    const newSticker: Partial<Sticker> = {
      id: uuidv4(),
      code,
      numbers,
      userId: ownerData.phone,
      purchasedAt: timestamp.toISOString(),
      status: 'pending',
      hash,
      ownerData: ownerData,
    };

    const { data, error } = await supabase
      .from('stickers')
      .insert(newSticker)
      .select();

    if (error) {
      console.error("Error creating pending ticket:", error);
      if (error.code === '23505') return { success: false, message: `El número ${numbers} ya está en proceso de compra o vendido.` };
      return { success: false, message: "Error creating ticket" };
    }

    return { success: true, message: "Ticket generado", sticker: data[0] as Sticker };
  },

  approveTicketManually: async (stickerId: string) => {
    if (!isCloudEnabled || !supabase) return false;

    const { error } = await supabase
      .from('stickers')
      .update({ status: 'active' })
      .eq('id', stickerId);

    if (error) {
      console.error("Error approving ticket:", error);
      return false;
    }

    return true;
  },

  getStickerByCode: async (code: string): Promise<Sticker | null> => {
    if (!isCloudEnabled || !supabase) return null;

    const { data, error } = await supabase
      .from('stickers')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error("Error fetching sticker by code:", error);
      return null;
    }

    return data as Sticker;
  },

  updateStickerOwner: async (stickerId: string, ownerData: Partial<OwnerData>) => {
    if (!isCloudEnabled || !supabase) return;

    const { data, error } = await supabase
      .from('stickers')
      .update({ ownerData })
      .eq('id', stickerId);

    if (error) {
      console.error("Error updating sticker owner:", error);
    }

    return data;
  },
};