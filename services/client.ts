
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// In a real scenario, you would set these variables in your build environment.
// For this demo, if they are empty, the app falls back to LocalStorage (Demo Mode).
// To enable Multi-User Realtime DB: Create a Supabase project and fill these.
const SUPABASE_URL = 'https://wcwtshnxnkoaeldmcefs.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3RzaG54bmtvYWVsZG1jZWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTM0NzAsImV4cCI6MjA3OTMyOTQ3MH0.I-YM7GJs-_cnkzxeCGXVcOueYvf-c-Za8u7rvJ-3DEc'; 

export const isCloudEnabled = !!(SUPABASE_URL && SUPABASE_KEY);

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
