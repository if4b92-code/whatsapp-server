
import { Sticker } from '../types';

export const notificationService = {
    getPurchaseConfirmationMessage: (sticker: Sticker): string => {
        const verificationLink = `https://ganarapp-36821139-58982.web.app/?view=verify&code=${sticker.code}`;
        return `Hola ${sticker.ownerData.fullName}, tu Ticket (ADC) *${sticker.numbers}* ha sido registrado correctamente. 🚀\n\nPuedes verificarlo en el siguiente enlace:\n${verificationLink}\n\n¡Mucho éxito! 🍀`;
    },

    getSellerConfirmationMessage: (sticker: Sticker): string => {
        const commission = sticker.price * 0.30;
        return `¡Venta exitosa! ✅\n\nHas vendido el número *${sticker.numbers}* a *${sticker.ownerData.fullName}*.\n\nComisión ganada: *${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(commission)}*\n\n¡Sigue así! 💰`;
    },

    getAccessCodeMessage: (code: string): string => {
        return `¡Código de Acceso a GanarApp! 🔐\n\nTu código de verificación es: *${code}*\n\nÚsalo para iniciar sesión de forma segura.`;
    }
};
