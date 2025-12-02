
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState,
    WASocket
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

// Use a variable to store the socket instance
let sock: WASocket | undefined;

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

    // Create a new socket instance
    const newSock = makeWASocket({
        auth: state,
        browser: ['Chrome', 'Desktop', '20.0.0'],
        logger: logger as any,
    });

    // Assign it to the outer variable
    sock = newSock;

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
                // Re-run the connection logic
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            logger.info('Opened connection');
            const gatewayUrl = process.env.RENDER_EXTERNAL_URL;
            if (gatewayUrl) {
                logger.info(`Available at your gateway URL: ${gatewayUrl}`);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// This function starts the Express server
function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3001;

    const corsOptions = {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };

    app.use(cors(corsOptions));
    app.use(express.json());

    // Health check endpoint for Render
    app.get('/', (req, res) => {
        const isConnected = sock?.user;
        res.status(200).json({ 
            status: 'ok', 
            message: 'WhatsApp server is running.',
            whatsapp_connected: !!isConnected 
        });
    });

    // Define the endpoint to send messages
    app.post('/send-message', async (req, res) => {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ success: false, error: 'Missing "to" or "message" in request body' });
        }

        // Check if the socket is ready
        if (!sock || !sock.user) {
            return res.status(503).json({ success: false, error: 'WhatsApp client is not ready. Scan the QR code first.' });
        }

        try {
            const jid = `${to}@s.whatsapp.net`;
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

    app.listen(PORT, () => {
        console.log(`WhatsApp server with Express is listening on port ${PORT}`);
        // Start WhatsApp connection AFTER the server is listening
        connectToWhatsApp();
    });
}

// Start the server
startServer();

console.log('WhatsApp server starting...');
