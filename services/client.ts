
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// These variables are now loaded from your hosting environment.
// This is more secure and allows you to use different keys for development and production.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY; 

export const isCloudEnabled = !!(SUPABASE_URL && SUPABASE_KEY);

if (!isCloudEnabled) {
  console.warn("Supabase credentials are not set. Application may not function correctly.");
  console.warn("Please provide VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your environment variables.");
}

export const supabase = isCloudEnabled 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

/**
 * Robust UUID generator that works in all environments (even non-secure contexts)
 */
export const uuidv4 = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Ignore crypto errors and fallback
  }

  // Fallback for environments where crypto.randomUUID is not available or fails
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// In-memory fallback for device ID if localStorage is blocked
let memoryDeviceId = '';

/**
 * Gets or creates a unique ID for this device/browser.
 * This allows users to have a "Wallet" without logging in via email/password.
 * Safely handles security exceptions if localStorage is blocked.
 */
export const getDeviceId = (): string => {
  const STORAGE_KEY = 'ganarapp_device_id';
  
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    
    return deviceId;
  } catch (e) {
    console.warn("LocalStorage access denied or failed. Using in-memory session ID.", e);
    if (!memoryDeviceId) {
      memoryDeviceId = uuidv4();
    }
    return memoryDeviceId;
  }
};
