
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
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This function establishes the connection with WhatsApp
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));

    const logger = pino({
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, ignore: 'pid,hostname' }
        }
    });

    const sock = makeWASocket({
        auth: state,
        browser: ['Chrome', 'Desktop', '20.0.0'],
        logger: logger as any,
    });

    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("QR Code generated. Scan it with your phone.");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.error('Connection closed due to %s, reconnecting %s', lastDisconnect?.error || 'unknown error', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            logger.info('Opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
}

// This function starts the Express server
async function startServer() {
    const sock = await connectToWhatsApp();
    const app = express();
    const port = 3001;

    // Detailed CORS configuration
    const corsOptions = {
        origin: '*', // Allow all origins
        credentials: true, // Allow cookies, authorization headers, etc.
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };

    // Middlewares
    app.use(cors(corsOptions)); // Enable CORS with detailed options
    app.use(express.json()); // Parse JSON bodies

    // Define the endpoint to send messages
    app.post('/send-message', async (req, res) => {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ success: false, error: 'Missing "to" or "message" in request body' });
        }

        try {
            // Format phone number to WhatsApp JID
            const jid = `${to}@s.whatsapp.net`;
            
            // Check if the number is registered on WhatsApp
            const [result] = await sock.onWhatsApp(jid) || [];

            if (result?.exists) {
                await sock.sendMessage(jid, { text: message });
                res.status(200).json({ success: true, message: 'Message sent successfully.' });
            } else {
                res.status(404).json({ success: false, message: 'The specified number is not on WhatsApp.' });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            res.status(500).json({ success: false, error: 'Failed to send message' });
        }
    });

    app.listen(port, () => {
        console.log(`WhatsApp server with Express is listening on http://localhost:${port}`);
    });
}

// Start the server
startServer();

console.log('WhatsApp server starting...');
