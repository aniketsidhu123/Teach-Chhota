import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  displayName: string;
  classLevel: number;
  friendCode: string;
  avatarStage: number;
  samajhScoreTotal: number;
  samajhScoreMaths: number;
  samajhScoreScience: number;
  gyaanCoins: number;
  teachingStyle: string | null;
  streakCurrent: number;
  streakBest: number;
  streakFreezeAvailable: number;
  weeklyRingDays: string;
  subscriptionTier: "free" | "plus";
  subscriptionExpiresAt: string | null;
  profileTheme: string;
  profileVisibility: "friends" | "hidden";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (friendCode: string) => Promise<boolean>;
  register: (displayName: string, classLevel: number) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocally: (updater: (prev: User | null) => User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tc_token";
const USER_KEY = "tc_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auto-init: verify token or create guest student if no user exists
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
            await createGuestAccount();
          }
        } catch {
          // Offline: keep cached user
        }
      } else {
        // First-time visitor: auto-create student account
        await createGuestAccount();
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  async function createGuestAccount() {
    try {
      const names = ["Aarav", "Ananya", "Rohan", "Diya", "Kabir", "Meera", "Vivaan", "Ishaan"];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: randomName, classLevel: 8 }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn("Could not auto-register offline guest account", err);
    }
  }

  async function login(friendCode: string): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendCode: friendCode.trim().toUpperCase() }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  }

  async function register(displayName: string, classLevel: number): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, classLevel }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    createGuestAccount();
  }

  async function refreshUser() {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch {
      // Offline
    }
  }

  function updateUserLocally(updater: (prev: User | null) => User | null) {
    setUser((prev) => {
      const updated = updater(prev);
      if (updated) {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
