import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));

    const logger = pino({
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname', // Clean up the output
            }
        }
    });

    const sock = makeWASocket({
        auth: state,
        browser: ['Chrome', 'Desktop', '20.0.0'],
        logger: logger as any,
    });

    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if(qr) {
            qrcode.generate(qr, { small: true });
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.error('connection closed due to %s, reconnecting %s', lastDisconnect?.error || 'unknown error', shouldReconnect);
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        } else if(connection === 'open') {
            logger.info('opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
}

connectToWhatsApp();

console.log('WhatsApp server starting...');