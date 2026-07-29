"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { PLAN_LABELS } from "@/lib/plans";
import { getAllProfiles } from "@/lib/store";
import { Profile } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.replace("/settings");
    }
  }, [isLoading, role, router]);

  useEffect(() => {
    if (role === "admin") {
      getAllProfiles()
        .then(setProfiles)
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }
  }, [role]);

  if (isLoading || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Tap a user to manage their plan and details.</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        {profiles.map((profile) => (
          <UserListItem
            key={profile.id}
            profile={profile}
            onClick={() => router.push(`/admin/${profile.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function UserListItem({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  const displayName = profile.business_name || profile.full_name || profile.email || profile.id;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer hover:bg-muted/50"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-sm font-medium">{displayName}</CardTitle>
          {profile.email && profile.email !== displayName && (
            <CardDescription className="truncate">{profile.email}</CardDescription>
          )}
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <Badge variant={profile.plan === "free" ? "outline" : "default"}>
            {PLAN_LABELS[profile.plan]}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  );
}
