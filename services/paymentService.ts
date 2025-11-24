
import { dbService } from './db';

export const paymentService = {
  /**
   * Crea una preferencia en Mercado Pago y redirige al usuario.
   */
  createMercadoPagoPreference: async (price: number, reference: string): Promise<void> => {
      const settings = await dbService.getSettings();
      
      if (!settings.mpAccessToken || settings.mpAccessToken.length < 10) {
          throw new Error("MP_TOKEN_MISSING");
      }

      const urlObj = new URL(window.location.href);
      const backUrl = `${urlObj.origin}${urlObj.pathname}`;

      const preferenceData = {
          items: [
              {
                  id: reference,
                  title: "Ticket Sorteo GanarApp",
                  quantity: 1,
                  currency_id: "COP",
                  unit_price: price
              }
          ],
          external_reference: reference,
          back_urls: {
              success: backUrl,
              failure: backUrl,
              pending: backUrl
          },
          auto_return: "approved",
          payment_methods: {
              excluded_payment_methods: [],
              excluded_payment_types: []
          }
      };

      const proxies = [
          "https://corsproxy.io/?",
          "https://api.allorigins.win/raw?url=",
      ];

      let lastError;

      for (const proxy of proxies) {
          try {
              const mpApiUrl = "https://api.mercadopago.com/checkout/preferences";
              const fullUrl = proxy + encodeURIComponent(mpApiUrl);
              
              const response = await fetch(fullUrl, {
                  method: "POST",
                  headers: {
                      "Authorization": `Bearer ${settings.mpAccessToken}`,
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(preferenceData)
              });

              if (response.status === 401 || response.status === 403) {
                  throw new Error("MP_UNAUTHORIZED");
              }

              const data = await response.json();
              
              if (data.init_point) {
                  window.location.href = data.init_point;
                  return; 
              }
          } catch (e: any) {
              console.warn(`Proxy ${proxy} failed:`, e);
              lastError = e;
              if (e.message === "MP_UNAUTHORIZED") throw e;
          }
      }

      throw lastError || new Error("NETWORK_BLOCK");
  },

  depositFunds: async (amount: number) => {
    return { success: false, newBalance: 0 };
  }
};
