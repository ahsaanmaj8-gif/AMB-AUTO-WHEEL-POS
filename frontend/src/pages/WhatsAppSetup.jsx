import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = "https://amb-auto-wheel-pos.onrender.com";

export default function WhatsAppSetup() {
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("Connecting to WhatsApp...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkWhatsApp = async () => {
      try {
        // axios khud JSON parse karta hai, data response.data mein hota hai
        const { data } = await axios.get(`${API_URL}/api/whatsapp/qr`);

        // console.log("WhatsApp QR API response:", data);

        if (!active) return;

        if (data.connected) {
          setQr("");
          setStatus("WhatsApp connected successfully!");
        } else if (data.qr) {
          setQr(data.qr);
          setStatus("Scan the QR code with WhatsApp on your phone.");
        } else {
          setQr("");
          setStatus(data.message || "QR not ready yet. Please wait...");
        }
      } catch (error) {
        if (!active) return;
        setQr("");
        setStatus(
          error.response?.data?.message ||
            error.message ||
            "Unable to connect to backend."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    checkWhatsApp();
    const timer = setInterval(checkWhatsApp, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f6fb",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          background: "#fff",
          padding: 28,
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          boxShadow: "0 8px 35px #00000012",
        }}
      >
        <h1>WhatsApp Setup</h1>
        <p>Connect your workshop WhatsApp account.</p>

        <p role="status">{loading ? "Checking WhatsApp..." : status}</p>

        {qr && (
          <>
            <img
              src={qr}
              alt="WhatsApp linking QR code"
              style={{ width: "100%", maxWidth: 300 }}
            />
            <p>Open WhatsApp on your phone → Linked devices → Link a device.</p>
          </>
        )}
      </section>
    </main>
  );
}