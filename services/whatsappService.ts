
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { Sticker, LotteryResult } from '../types';

let sock: any = null;
let onReadyCallback: (() => void) | null = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: { info: () => {}, error: console.error, warn: () => {}, debug:()=>{} },
        browser: ['Chrome (Desktop)', 'Desktop', '20.0.0'],
    });

    sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log("¡Nuevo QR Code! Por favor, escanéalo con tu teléfono:", qr);
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada, reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('¡Conexión con WhatsApp abierta!');
            if (onReadyCallback) {
                onReadyCallback();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

function onWhatsAppReady(callback: () => void) {
    onReadyCallback = callback;
}

// FORMATTERS
const formatMovementMessage = (sticker: Sticker): string => {
    return `¡Hola ${sticker.ownerData.name}! Tu compra ha sido exitosa. Tu número de ticket es ${sticker.code}. ¡Mucha suerte!`;
}

const formatLotteryWinMessage = (result: LotteryResult): string => {
    if (result.winnerInfo) {
        return `¡Felicidades ${result.winnerInfo.name}! Has ganado el sorteo de ${result.prizeAmount} con el número ${result.winningNumber}.`;
    }
    return `El sorteo con el número ${result.winningNumber} ha finalizado.`;
}

const formatVerificationCodeMessage = (code: string): string => {
    return `Tu código de verificación para GanarApp es: ${code}`;
};

const formatManualApprovalMessage = (sticker: Sticker): string => {
    return `¡Tu ticket ${sticker.code} ha sido aprobado manualmente y ya está activo! ¡Mucha suerte!`;
};

const formatBalanceAddedMessage = (amount: number, newBalance: number): string => {
    return `Se ha añadido un saldo de ${amount} a tu billetera. Tu nuevo saldo es: ${newBalance}.`;
};


// MESSAGE SENDER
const sendMessage = async (to: string, message: string) => {
    if (sock && sock.user) {
        try {
            const formattedTo = to.startsWith('57') ? `${to}@s.whatsapp.net` : `57${to}@s.whatsapp.net`;
            await sock.sendMessage(formattedTo, { text: message });
            console.log(`Mensaje enviado a ${formattedTo}`);
            return true;
        } catch (error) {
            console.error(`Error enviando mensaje a ${to}:`, error);
            return false;
        }
    } else {
        console.warn('WhatsApp no está listo. El mensaje no se ha enviado.');
        return false;
    }
};

export const whatsappService = {
    connectToWhatsApp,
    onWhatsAppReady,
    sendMessage,
    formatters: {
        formatMovementMessage,
        formatLotteryWinMessage,
        formatVerificationCodeMessage,
        formatManualApprovalMessage,
        formatBalanceAddedMessage,
    }
};

// Auto-connect on startup
connectToWhatsApp().catch(err => console.error("Error inicial al conectar con WhatsApp:", err));
