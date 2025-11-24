
export interface OwnerData {
  fullName: string; // Required now
  phone: string; // WhatsApp number with country code (Required)
  countryCode: string;
  documentId?: string; // Optional at purchase, required for KYC later
  claimedAt?: string;
}

export interface Sticker {
  id: string;
  code: string; // e.g., GA-20231119-A1B2
  numbers: string; // 4 digits
  userId: string; // Linked to Phone Number now, not DeviceID
  purchasedAt: string;
  status: 'pending' | 'active' | 'redeemed' | 'expired';
  hash: string; // Simulate HMAC signature
  ownerData: OwnerData; 
}

export interface GlobalSettings {
  // Prize Config
  jackpotAmount: number; // Weekly Grand Prize
  accumulatedPool: number; // Extra pool
  dailyPrizeAmount: number; // Fixed daily prize
  topBuyerPrize: number; // Prize for the user with most tickets
  
  // General Config
  ticketPrice: number; // Single price for the combo ticket
  officialLotteryNameWeekly: string;
  nextDrawDateWeekly: string;

  // Mercado Pago Config
  mpAccessToken?: string;       
  mpPublicKey?: string;         
  
  // Soporte
  adminWhatsApp?: string;
}

export interface User {
  id: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface LotterySchedule {
  day: number; 
  dayName: string;
  lotteries: string[];
}
