
const makeWASocket = require("@whiskeysockets/baileys").default;

const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");

// Always resolve the session folder relative to this file.
// Expected location: backend/whatsapp/auth_info
const SESSION_FOLDER = path.join(__dirname, "auth_info");

let sock = null;
let isConnected = false;
let latestQR = null;
let isConnecting = false;
let reconnectTimer = null;

const connectToWhatsApp = async () => {
    // Prevent duplicate connection attempts.
    if (isConnecting) {
        // console.log("[WhatsApp] Connection attempt already in progress.");
        return sock;
    }

    // Don't create another socket if already connected.
    if (sock && isConnected) {
        // console.log("[WhatsApp] Already connected.");
        return sock;
    }

    isConnecting = true;

    try {
        // console.log("[WhatsApp] Starting connection...");
        // console.log("[WhatsApp] Session folder:", SESSION_FOLDER);

        // Create the directory if it doesn't exist.
        fs.mkdirSync(SESSION_FOLDER, { recursive: true });

        const { state, saveCreds } =
            await useMultiFileAuthState(SESSION_FOLDER);

        // console.log("[WhatsApp] Authentication state loaded.");

        const { version } = await fetchLatestBaileysVersion();

        // console.log(
        //     "[WhatsApp] Using Baileys version:",
        //     version.join(".")
        // );

        sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Auto Workshop", "Chrome", "1.0.0"],
        });

        const currentSocket = sock;

        currentSocket.ev.on("creds.update", async () => {
            try {
                await saveCreds();
                // console.log("[WhatsApp] Authentication credentials saved.");
            } catch (error) {
                console.error(
                    "[WhatsApp] Failed to save credentials:",
                    error.message
                );
            }
        });

        currentSocket.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                latestQR = qr;
                // console.log(
                //     "[WhatsApp] QR generated. Open the protected setup page."
                // );
            }

            if (connection === "connecting") {
                // console.log("[WhatsApp] Connecting to WhatsApp...");
            }

            if (connection === "open") {
                isConnected = true;
                latestQR = null;

                console.log(
                    "[WhatsApp] Connected successfully!"
                );
            }

            if (connection === "close") {
                // Ignore close events from an outdated socket.
                if (sock !== currentSocket) {
                    // console.log(
                    //     "[WhatsApp] Ignoring close event from an old socket."
                    // );
                    return;
                }

                isConnected = false;
                latestQR = null;
                sock = null;

                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const errorMessage = error?.message || "Unknown error";

                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;

                // console.error(
                //     "[WhatsApp] Connection closed:",
                //     JSON.stringify({
                //         statusCode: statusCode ?? null,
                //         errorMessage,
                //         shouldReconnect,
                //         loggedOut:
                //             statusCode === DisconnectReason.loggedOut,
                //     })
                // );

                if (shouldReconnect) {
                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                    }

                    // console.log(
                    //     "[WhatsApp] Reconnecting in 5 seconds..."
                    // );

                    reconnectTimer = setTimeout(() => {
                        reconnectTimer = null;

                        connectToWhatsApp().catch((reconnectError) => {
                            console.error(
                                "[WhatsApp] Reconnection failed:",
                                reconnectError.message
                            );
                        });
                    }, 5000);
                } else {
                    console.error(
                        "[WhatsApp] Session logged out. A new QR pairing is required."
                    );
                }
            }
        });

        return sock;
    } catch (error) {
        sock = null;
        isConnected = false;

        console.error(
            "[WhatsApp] Connection startup failed:",
            error.stack || error.message
        );

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
