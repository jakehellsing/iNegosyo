"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { ALL_PLANS, formatDateInput, parseExpiryDate, PLAN_LABELS } from "@/lib/plans";
import { getProfileById, updateUserPlan, updateProfileDetails } from "@/lib/store";
import { PlanTier, Profile } from "@/lib/types";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { role, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.replace("/settings");
      return;
    }
    if (role === "admin") {
      getProfileById(userId)
        .then((p) => {
          if (p) setProfile(p);
          else setError("User not found.");
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }
  }, [isLoading, role, router, userId]);

  if (isLoading || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm text-destructive">{error || "User not found."}</p>
      </div>
    );
  }

  const displayName = profile.business_name || profile.full_name || profile.email || profile.id;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{displayName}</h1>
          {profile.email && profile.email !== displayName && (
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          )}
        </div>
      </div>

      <p className="break-all text-xs text-muted-foreground">{profile.id}</p>

      <ProfileEditor profile={profile} onSaved={setProfile} />
    </div>
  );
}

function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [plan, setPlan] = useState<PlanTier>(profile.plan);
  const [maxCustomers, setMaxCustomers] = useState(profile.max_customers?.toString() ?? "");
  const [maxOrders, setMaxOrders] = useState(profile.max_orders?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(formatDateInput(profile.plan_expires_at));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [contactNumber, setContactNumber] = useState(profile.contact_number ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsStatus, setDetailsStatus] = useState<string | null>(null);

  useEffect(() => {
    setPlan(profile.plan);
    setMaxCustomers(profile.max_customers?.toString() ?? "");
    setMaxOrders(profile.max_orders?.toString() ?? "");
    setExpiresAt(formatDateInput(profile.plan_expires_at));
    setBusinessName(profile.business_name ?? "");
    setFullName(profile.full_name ?? "");
    setContactNumber(profile.contact_number ?? "");
    setAddress(profile.address ?? "");
    setStatus(null);
    setDetailsStatus(null);
  }, [profile]);

  const parse = (v: string) => (v.trim() === "" ? null : Number(v));

  const savePlan = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateUserPlan(profile.id, {
        plan,
        max_customers: parse(maxCustomers),
        max_orders: parse(maxOrders),
        plan_expires_at: parseExpiryDate(expiresAt),
      });
      onSaved(updated);
      setStatus("Saved");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    setDetailsSaving(true);
    setDetailsStatus(null);
    try {
      const updated = await updateProfileDetails(profile.id, {
        business_name: businessName.trim() || null,
        full_name: fullName.trim() || null,
        contact_number: contactNumber.trim() || null,
        address: address.trim() || null,
      });
      onSaved(updated);
      setDetailsStatus("Saved");
    } catch (e) {
      setDetailsStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Plan</CardTitle>
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

          {plan !== "free" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Plan expires</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-0 text-xs text-muted-foreground"
                  onClick={() => setExpiresAt("")}
                  disabled={!expiresAt}
                >
                  Clear
                </Button>
              </div>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank so the plan never expires. Expired paid plans fall back to Free.
              </p>
            </div>
          )}

          {plan === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max customers</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Unlimited"
                  value={maxCustomers}
                  onValueChange={setMaxCustomers}
                />
              </div>
              <div className="space-y-2">
                <Label>Max orders</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Unlimited"
                  value={maxOrders}
                  onValueChange={setMaxOrders}
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">Leave blank for unlimited.</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={savePlan} disabled={saving}>
              {saving ? "Saving…" : "Save plan"}
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

      <Separator />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={businessName} onValueChange={setBusinessName} />
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onValueChange={setFullName} />
          </div>
          <div className="space-y-2">
            <Label>Contact Number</Label>
            <Input type="tel" value={contactNumber} onValueChange={setContactNumber} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={address} onValueChange={setAddress} />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveDetails} disabled={detailsSaving}>
              {detailsSaving ? "Saving…" : "Save details"}
            </Button>
            {detailsStatus && (
              <span
                className={
                  detailsStatus === "Saved"
                    ? "text-sm text-muted-foreground"
                    : "text-sm text-destructive"
                }
              >
                {detailsStatus}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
