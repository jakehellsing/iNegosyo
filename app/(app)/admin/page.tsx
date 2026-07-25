"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { ALL_PLANS, PLAN_LABELS } from "@/lib/plans";
import { getAllProfiles, updateUserPlan } from "@/lib/store";
import { PlanTier, Profile } from "@/lib/types";

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

  const onSaved = (updated: Profile) =>
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Plans</h1>
          <p className="text-sm text-muted-foreground">Assign plans and custom limits.</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        {profiles.map((profile) => (
          <ProfileRow key={profile.id} profile={profile} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}

function ProfileRow({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [plan, setPlan] = useState<PlanTier>(profile.plan);
  const [maxCustomers, setMaxCustomers] = useState(
    profile.max_customers?.toString() ?? ""
  );
  const [maxOrders, setMaxOrders] = useState(profile.max_orders?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const parse = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateUserPlan(profile.id, {
        plan,
        max_customers: parse(maxCustomers),
        max_orders: parse(maxOrders),
      });
      onSaved(updated);
      setStatus("Saved");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="break-all text-sm font-medium">
          {profile.id}
          {profile.role === "admin" && (
            <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">admin</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Plan</Label>
          <Select value={plan} onValueChange={(v) => v && setPlan(v as PlanTier)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLAN_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {plan === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`mc-${profile.id}`}>Max customers</Label>
              <Input
                id={`mc-${profile.id}`}
                type="number"
                min={0}
                placeholder="Unlimited"
                value={maxCustomers}
                onValueChange={setMaxCustomers}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`mo-${profile.id}`}>Max orders</Label>
              <Input
                id={`mo-${profile.id}`}
                type="number"
                min={0}
                placeholder="Unlimited"
                value={maxOrders}
                onValueChange={setMaxOrders}
              />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">
              Leave blank for unlimited.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {status && (
            <span
              className={
                status === "Saved" ? "text-sm text-muted-foreground" : "text-sm text-destructive"
              }
            >
              {status}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
