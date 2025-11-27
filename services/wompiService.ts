
import { GlobalSettings, Sticker, OwnerData } from "../types";
import { dbService } from "./db";

const getWompiApiBaseUrl = (settings: GlobalSettings) => {
    return settings.wompiTestMode ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
};

export const wompiService = {
    createPaymentLink: async (sticker: Sticker, ownerData: OwnerData, settings: GlobalSettings): Promise<string | null> => {
        if (!settings.wompiPublicKey) {
            console.error("Wompi public key is not set");
            return null;
        }

        const wompiApiBaseUrl = getWompiApiBaseUrl(settings);

        const paymentData = {
            amount_in_cents: sticker.price * 100,
            currency: "COP",
            customer_email: `user-${ownerData.phone}@ganarapp.co`,
            payment_method: {
                type: "CARD",
                installments: 1,
            },
            reference: sticker.id,
            public_key: settings.wompiPublicKey,
            redirect_url: `https://ganarapp.co/verify/${sticker.code}`,
        };

        try {
            const response = await fetch(`${wompiApiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.wompiPublicKey}`,
                },
                body: JSON.stringify(paymentData),
            });

            const responseData = await response.json();

            if (responseData.data && responseData.data.id) {
                return `${wompiApiBaseUrl}/transactions/${responseData.data.id}`;
            } else {
                console.error("Error creating Wompi payment link:", responseData);
                return null;
            }
        } catch (error) {
            console.error("Error creating Wompi payment link:", error);
            return null;
        }
    },
};
