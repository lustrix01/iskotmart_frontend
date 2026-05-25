import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { rememberClientSession, clearRememberedClientSession } from "../api/clientSession";

export default function Email2fa({ email, password, rememberMe, redirectTo = "", onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer = null;
    timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const submitCode = async () => {
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify_2fa.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Invalid code");
      // show inline success, finish login and navigate immediately
      setSuccessMessage("Code verified — signing you in...");
      login(json.user);
      if (rememberMe) rememberClientSession(); else clearRememberedClientSession();
      const destination = redirectTo || (json.user?.role === "merchant" ? "/merchant" : "/");
      navigate(destination, { replace: true });
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResendDisabled(true);
    setError("");
    setInfoMessage("");
    try {
      // attempt to re-trigger OTP by re-calling login with stored credentials
      const res = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok && json.error) throw new Error(json.error);
      // if requires2fa returned again, server resent the OTP
      setCountdown(300);
      setInfoMessage('A new code was sent to your email.');
    } catch (e) {
      setError(e.message || "Unable to resend code");
      setResendDisabled(false);
    }
    // cooldown 45s
    setTimeout(() => setResendDisabled(false), 45000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[#003366] mb-2">Two-step verification</h3>
        <p className="text-xs text-gray-400 mb-4">We sent a one-time code to {email}. It expires in {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}.</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
          placeholder="6-digit code"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-center text-xl font-mono"
        />

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {infoMessage && !error && <p className="text-sm text-blue-600 mb-2">{infoMessage}</p>}
        {successMessage && <p className="text-sm text-green-600 mb-2">{successMessage}</p>}

        <div className="flex gap-3">
          <button onClick={submitCode} disabled={loading} className="flex-1 bg-[#FF851B] text-white py-3 rounded-xl font-bold">{loading ? 'Verifying...' : 'Verify'}</button>
          <button onClick={resend} disabled={resendDisabled} className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl">{resendDisabled ? 'Resend (wait)' : 'Resend'}</button>
        </div>

        <div className="mt-4 text-center">
          <button onClick={onClose} className="text-xs text-gray-500 hover:underline">Cancel</button>
        </div>
      </div>
    </div>
  );
}
