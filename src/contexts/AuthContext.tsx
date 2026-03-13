import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<Pick<UserProfile, "name">>) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  updateProfile: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildProfile = useCallback((authUser: User): UserProfile => {
    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Guest",
      email: authUser.email || "",
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setUser(buildProfile(newSession.user));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        setUser(buildProfile(existingSession.user));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [buildProfile]);

  const updateProfile = useCallback((updates: Partial<Pick<UserProfile, "name">>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    // Also update in Supabase metadata
    if (updates.name) {
      supabase.auth.updateUser({ data: { name: updates.name } });
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
