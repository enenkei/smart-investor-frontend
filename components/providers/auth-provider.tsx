"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { getMe, getSessionId } from "@/controllers/user-controller";

function AuthSync() {
  const { status } = useSession();
  const { user, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated" && !user) {
      const sync = async () => {
        try {
          const me = await getMe();
          const sid = await getSessionId();
          setAuth(me as any, sid);
        } catch (error) {
          console.error("Failed to sync auth session:", error);
        }
      };
      sync();
    } else if (status === "unauthenticated" && user) {
      logout();
    }
  }, [status, user, setAuth, logout]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}

