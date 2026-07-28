"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { updateProfile as updateProfileInStore } from "@/lib/store";
import { Profile, PlanTier } from "@/lib/types";
import {
  effectivePlan,
  effectiveLimit,
  hasFeature,
  LimitedResource,
  PlanFeature,
} from "@/lib/plans";

export interface SignUpProfileData {
  business_name: string;
  full_name: string;
  contact_number: string;
  address?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  plan: PlanTier;
  role: string;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (
    email: string,
    password: string,
    profileData: SignUpProfileData
  ) => Promise<string | undefined>;
  updateProfile: (update: Partial<SignUpProfileData>) => Promise<string | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setProfile(sessionUser ? await fetchProfile(supabase, sessionUser.id) : null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setProfile(sessionUser ? await fetchProfile(supabase, sessionUser.id) : null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) return error.message;
    router.push("/dashboard");
  };

  const signUp = async (email: string, password: string, profileData: SignUpProfileData) => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: profileData.business_name,
          full_name: profileData.full_name,
          contact_number: profileData.contact_number,
          address: profileData.address,
        },
      },
    });
    if (error) return error.message;
    router.push("/login");
  };

  const updateProfile = async (update: Partial<SignUpProfileData>) => {
    if (!user) return "Not authenticated";
    try {
      const refreshed = await updateProfileInStore({
        business_name: update.business_name?.trim() || null,
        full_name: update.full_name?.trim() || null,
        contact_number: update.contact_number?.trim() || null,
        address: update.address?.trim() || null,
      });
      setProfile(refreshed);
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        plan: effectivePlan(profile),
        role: profile?.role ?? "user",
        isLoading,
        signIn,
        signUp,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** True when the current user's effective plan unlocks `feature`. */
export function useFeature(feature: PlanFeature): boolean {
  const { profile } = useAuth();
  return hasFeature(profile, feature);
}

/** Effective limit for a resource; `null` means unlimited. */
export function usePlanLimit(resource: LimitedResource): number | null {
  const { profile } = useAuth();
  return effectiveLimit(profile, resource);
}

/**
 * Guards children behind a required feature, mirroring {@link AuthGuard}.
 * Renders `fallback` (default: an upgrade prompt) when the feature is locked.
 */
export function RequirePlan({
  feature,
  children,
  fallback,
}: {
  feature: PlanFeature;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLoading } = useAuth();
  const unlocked = useFeature(feature);

  if (isLoading) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <>
        {fallback ?? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            This feature is available on the Pro plan. Contact an admin to upgrade.
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
