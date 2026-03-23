import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "../api";

const LOGIN_POLL_INTERVAL = 2_000;

export function useIcaAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    api.checkStatus().then(setAuthenticated).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startLogin = async () => {
    setError(null);
    setStarting(true);
    try {
      const data = await api.startLogin();
      setQrCode(data.qrCode);

      pollRef.current = setInterval(async () => {
        try {
          const poll = await api.pollLogin();
          if (poll.status === "pending") {
            if (poll.qrCode) setQrCode(poll.qrCode);
          } else if (poll.status === "complete") {
            stopPolling();
            setQrCode(null);
            setAuthenticated(true);
          } else {
            stopPolling();
            setQrCode(null);
            setError(poll.message ?? "Login failed");
          }
        } catch {
          stopPolling();
          setError("Failed to connect to server");
          setQrCode(null);
        }
      }, LOGIN_POLL_INTERVAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to server");
    } finally {
      setStarting(false);
    }
  };

  const cancelLogin = async () => {
    stopPolling();
    setQrCode(null);
    setError(null);
    await api.cancelLogin().catch(() => {});
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setAuthenticated(false);
  };

  const setUnauthenticated = () => setAuthenticated(false);

  return {
    authenticated,
    qrCode,
    starting,
    error,
    setError,
    startLogin,
    cancelLogin,
    handleLogout,
    setUnauthenticated,
  };
}
