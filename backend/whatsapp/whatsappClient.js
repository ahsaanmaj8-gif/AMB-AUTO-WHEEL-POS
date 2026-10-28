const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");

const SESSIONS_ROOT = path.join(__dirname, "sessions");

// ✅ Per-workshop state (Map use karo)
const sockets = new Map();          // workshopId → sock
const connectionStatus = new Map(); // workshopId → boolean
const latestQRs = new Map();        // workshopId → QR string
const connecting = new Map();       // workshopId → boolean
const reconnectTimers = new Map();  // workshopId → timer

// Session folder per workshop
const getSessionFolder = (workshopId) => {
    const folder = path.join(SESSIONS_ROOT, workshopId.toString());
    fs.mkdirSync(folder, { recursive: true });
    return folder;
};

const connectToWhatsApp = async (workshopId) => {
    const wid = workshopId.toString();

    if (connecting.get(wid)) return sockets.get(wid);
    if (sockets.get(wid) && connectionStatus.get(wid)) return sockets.get(wid);

    connecting.set(wid, true);

    try {
        const sessionFolder = getSessionFolder(wid);
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Auto Workshop", "Chrome", "1.0.0"],
        });

        sockets.set(wid, sock);

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                latestQRs.set(wid, qr);
                console.log(`[WhatsApp ${wid}] QR generated`);
            }

            if (connection === "open") {
                connectionStatus.set(wid, true);
                latestQRs.delete(wid);
                console.log(`[WhatsApp ${wid}] Connected ✅`);

                // Workshop model update karo
                const Workshop = require("../models/workshopModel");
                Workshop.findByIdAndUpdate(wid, {
                    "whatsapp.connected": true,
                    "whatsapp.connectedAt": new Date()
                }).catch(err => console.error("Workshop update error:", err));
            }

            if (connection === "close") {
                if (sockets.get(wid) !== sock) return;

                connectionStatus.set(wid, false);
                latestQRs.delete(wid);
                sockets.delete(wid);

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    const timer = setTimeout(() => {
                        reconnectTimers.delete(wid);
                        connectToWhatsApp(wid).catch(err => 
                            console.error(`[WhatsApp ${wid}] Reconnect failed:`, err.message)
                        );
                    }, 5000);
                    reconnectTimers.set(wid, timer);
                } else {
                    console.log(`[WhatsApp ${wid}] Logged out — QR needed`);
                    // Workshop model update
                    const Workshop = require("../models/workshopModel");
                    Workshop.findByIdAndUpdate(wid, {
                        "whatsapp.connected": false
                    }).catch(() => {});
                }
            }
        });

        return sock;
    } catch (error) {
        sockets.delete(wid);
        connectionStatus.set(wid, false);
        console.error(`[WhatsApp ${wid}] Startup failed:`, error.message);
        throw error;
    } finally {
        connecting.set(wid, false);
    }
};

// ✅ Helpers — workshopId parameter ke saath
const getSocket = (workshopId) => sockets.get(workshopId.toString());
const getConnectionStatus = (workshopId) => {
    if (!workshopId) return false;

    return connectionStatus.get(workshopId.toString()) || false;
};
// const getConnectionStatus = (workshopId) => connectionStatus.get(workshopId.toString()) || false;
const getLatestQR = (workshopId) => latestQRs.get(workshopId.toString());

// ✅ Disconnect specific workshop
const disconnectWorkshop = async (workshopId) => {
    const wid = workshopId.toString();
    const sock = sockets.get(wid);
    if (sock) {
        try {
            await sock.logout();
        } catch (e) { /* ignore */ }
        sockets.delete(wid);
        connectionStatus.delete(wid);
        latestQRs.delete(wid);
    }
    // Session folder delete karo
    const folder = path.join(SESSIONS_ROOT, wid);
    if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
    }
};

// ✅ Sabhi workshops reconnect karo (server start pe)
const connectAllEnabledWorkshops = async () => {
    const Workshop = require("../models/workshopModel");
    const workshops = await Workshop.find({ "whatsapp.enabled": true });
    
    for (const w of workshops) {
        try {
            await connectToWhatsApp(w._id);
        } catch (err) {
            console.error(`Failed to connect workshop ${w._id}:`, err.message);
        }
    }
};

module.exports = {
    connectToWhatsApp,
    getSocket,
    getConnectionStatus,
    getLatestQR,
    disconnectWorkshop,
    connectAllEnabledWorkshops,
};