
const makeWASocket = require("@whiskeysockets/baileys").default;

const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");

// Auth session folder — do not delete after pairing
const SESSION_FOLDER = "./whatsapp/auth_info";

let sock = null;
let isConnected = false;
let latestQR = null;
let isConnecting = false;

const connectToWhatsApp = async () => {
    // Prevent duplicate connection attempts
    if (isConnecting) return sock;

    isConnecting = true;

    try {
        const { state, saveCreds } =
            await useMultiFileAuthState(SESSION_FOLDER);

        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Auto Workshop", "Chrome", "1.0.0"],
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                latestQR = qr;
                console.log(
                    "WhatsApp QR generated. Open the protected setup page."
                );
            }

            if (connection === "open") {
                isConnected = true;
                latestQR = null;

                console.log("WhatsApp Connected Successfully!");
            }

            if (connection === "close") {
                isConnected = false;
                latestQR = null;
                sock = null;

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;

                console.log(
                    "WhatsApp disconnected. Reconnecting:",
                    shouldReconnect
                );

                if (shouldReconnect) {
                    setTimeout(() => {
                        connectToWhatsApp().catch((error) => {
                            console.error(
                                "WhatsApp reconnect failed:",
                                error.message
                            );
                        });
                    }, 5000);
                } else {
                    console.log(
                        "WhatsApp logged out. A new pairing is required."
                    );
                }
            }
        });

        return sock;
    } catch (error) {
        sock = null;
        throw error;
    } finally {
        isConnecting = false;
    }
};

const getSocket = () => sock;
const getConnectionStatus = () => isConnected;
const getLatestQR = () => latestQR;

module.exports = {
    connectToWhatsApp,
    getSocket,
    getConnectionStatus,
    getLatestQR,
};
