import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaWhatsapp, FaCheckCircle, FaTimesCircle, FaSignOutAlt, FaRedo } from "react-icons/fa";

const API_URL = "https://amb-auto-wheel-pos.onrender.com";

export default function WhatsAppSetup() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [qr, setQr] = useState("");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Checking WhatsApp status...");
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const intervalRef = useRef(null);

  // ============ CHECK WHATSAPP STATUS ============
  const checkWhatsApp = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/whatsapp/qr`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data.connected) {
        setConnected(true);
        setQr("");
        setStatus("WhatsApp connected successfully!");
      } else if (data.qr) {
        setConnected(false);
        setQr(data.qr);
        setStatus("Scan the QR code with WhatsApp on your phone.");
      } else {
        setConnected(false);
        setQr("");
        setStatus(data.message || "QR not ready yet. Please wait...");
      }
    } catch (error) {
      setQr("");
      setConnected(false);
      const msg = error.response?.data?.message || error.message;
      setStatus(msg);

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ DISCONNECT WHATSAPP ============
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp? You will need to scan QR again.")) {
      return;
    }

    setDisconnecting(true);
    try {
      await axios.post(
        `${API_URL}/api/whatsapp/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("WhatsApp disconnected");
      setConnected(false);
      setQr("");
      checkWhatsApp();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  // ============ RECONNECT (refresh QR) ============
  const handleReconnect = () => {
    setLoading(true);
    setQr("");
    setStatus("Connecting...");
    checkWhatsApp();
  };

  // ============ POLLING LOGIC ============
  useEffect(() => {
    checkWhatsApp();

    // Start interval
    intervalRef.current = setInterval(checkWhatsApp, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stop polling when connected
  useEffect(() => {
    if (connected && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [connected]);

  // ============ RENDER ============
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaWhatsapp className="text-green-500" /> WhatsApp Setup
        </h2>
        <p className="text-gray-500">
          Connect your workshop WhatsApp account to send automatic oil change reminders.
        </p>
      </div>

      {/* Workshop Info */}
      <div className="card mb-6">
        <p className="text-sm text-gray-500">Workshop</p>
        <p className="font-medium text-gray-800">{user?.workshopName || "N/A"}</p>
      </div>

      {/* Main Card */}
      <div className="card">
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="spinner mb-4"></div>
            <p className="text-gray-500">Checking WhatsApp status...</p>
          </div>
        ) : connected ? (
          /* ============ CONNECTED STATE ============ */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-5xl text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">WhatsApp Connected!</h3>
            <p className="text-gray-500 mb-6">
              Your workshop WhatsApp is connected. Reminders will be sent automatically.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-left">
              <p className="font-medium text-gray-700 mb-1">✅ What's Working:</p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside">
                <li>Reminders will be sent from your WhatsApp</li>
                <li>Customers will receive your workshop name and number</li>
                <li>Auto-sending every 5 minutes check</li>
              </ul>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="btn-danger"
            >
              <FaSignOutAlt className="inline mr-2" />
              {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
            </button>
          </div>
        ) : qr ? (
          /* ============ QR STATE ============ */
          <div className="text-center py-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Scan QR Code to Connect
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
            </p>

            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
              <img
                src={qr}
                alt="WhatsApp QR code"
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-xs text-gray-400 mb-4">
              QR code refreshes automatically. Scan within 1 minute.
            </p>

            <button onClick={handleReconnect} className="btn-outline">
              <FaRedo className="inline mr-2" /> Refresh QR
            </button>
          </div>
        ) : (
          /* ============ NOT READY / ERROR STATE ============ */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimesCircle className="text-5xl text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              WhatsApp Not Connected
            </h3>
            <p className="text-gray-500 mb-4">{status}</p>

            <button onClick={handleReconnect} className="btn-primary">
              <FaRedo className="inline mr-2" /> Try Again
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="card mt-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-2">📌 How It Works</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Scan the QR code with your workshop's WhatsApp number</li>
          <li>Once connected, reminders will be sent automatically</li>
          <li>Each workshop has its own separate WhatsApp connection</li>
          <li>You can disconnect anytime — customers will stop receiving reminders</li>
        </ol>
      </div>
    </div>
  );
}