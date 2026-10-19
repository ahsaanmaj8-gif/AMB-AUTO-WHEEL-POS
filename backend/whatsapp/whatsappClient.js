// ============================================================
// WHATSAPP CLIENT - Baileys se connect karta hai
// Pehli baar QR scan karna hoga, phir session save ho jayega
// ============================================================

const makeWASocket = require("@whiskeysockets/baileys").default;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");

// Session save karne ki jagah
const SESSION_FOLDER = "./whatsapp/auth_info";

// Global variable jismein WhatsApp socket rahega
let sock = null;
let isConnected = false;

// ============================================================
// CONNECT TO WHATSAPP
// ============================================================
const connectToWhatsApp = async () => {
    // Auth state load karo (purana session ya naya)
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    // Socket banao
    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }), // Logs band
        printQRInTerminal: false, // Hum khud QR print karenge
        auth: state,
        browser: ["Auto Workshop", "Chrome", "1.0.0"],
    });

    // ============================================================
    // QR CODE - Pehli baar scan karna hoga
    // ============================================================
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR aaya to terminal pe print karo
        if (qr) {
            // console.log("\n📱 WHATSAPP QR CODE - SCAN THIS:");
            qrcode.generate(qr, { small: true });
            // console.log("\n👆 Open WhatsApp → Linked Devices → Link a Device\n");
        }

        // Connection open ho gaya
        if (connection === "open") {
            isConnected = true;
            console.log("✅ WhatsApp Connected Successfully!");
        }

        // Connection close ho gaya
        if (connection === "close") {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log("❌ WhatsApp Disconnected. Reconnecting:", shouldReconnect);

            // Agar user ne logout nahi kiya, to reconnect karo
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000);
            } else {
                console.log("🚫 Logged out from WhatsApp. Delete auth_info folder and restart.");
            }
        }
    });

    // Credentials save karo (session save)
    sock.ev.on("creds.update", saveCreds);

    return sock;
};

// ============================================================
// GET SOCKET - Bahar se access karne ke liye
// ============================================================
const getSocket = () => sock;
const getConnectionStatus = () => isConnected;

module.exports = {
    connectToWhatsApp,
    getSocket,
    getConnectionStatus,
};