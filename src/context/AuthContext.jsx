import { useState, useEffect } from "react";
import { AuthContext } from "./authContextObject";
import { clearRememberedClientSession } from "../api/clientSession";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/me.php", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No active session");
        }

        const payload = await response.json();
        if (isMounted) {
          setUser(payload.user || null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    setUser(null);
    clearRememberedClientSession();
    try {
      await fetch("/api/logout.php", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // The local auth state is already cleared; the next session check will reconcile.
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
