"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    session,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user,
  };
}
