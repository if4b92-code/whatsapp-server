
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Boom } from '@hapi/boom';

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(bodyParser.json());

let sock;
let qrCodeData; // Variable to hold the QR code string

// Function to connect to WhatsApp
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // We won't print it to the console, we'll expose it via an endpoint
        auth: state,
    });

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCodeData = qr;
            console.log('QR code received. Scan it in your application or by visiting http://localhost:3001/qr');
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                                  lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            // Reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection opened successfully!');
            qrCodeData = null; // Clear QR code data once connection is open
        }
    });

    // We can listen for messages here if needed in the future
    sock.ev.on('messages.upsert', async (m) => {
        // console.log(JSON.stringify(m, undefined, 2));
    });
}

// Endpoint to get the QR code
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.type('text/plain').send(qrCodeData);
    } else {
        res.status(404).send('QR code not available. Check the server console or wait for the connection to initialize.');
    }
});

// Endpoint to send a message
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).send({ status: 'error', message: 'The "number" and "message" fields are required.' });
    }

    if (sock && sock.user) {
        try {
            // Format the number to the correct WhatsApp ID format
            const waNumber = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
            console.log(`Sending message to ${waNumber}`);
            await sock.sendMessage(waNumber, { text: message });
            res.send({ status: 'success', message: 'Message sent successfully.' });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send({ status: 'error', message: 'Failed to send message.' });
        }
    } else {
        res.status(500).send({ status: 'error', message: 'WhatsApp client is not ready. Scan the QR code first.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Express server for WhatsApp listening on http://localhost:${port}`);
    connectToWhatsApp();
});
