"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { ALL_PLANS, formatDateInput, parseExpiryDate, PLAN_LABELS } from "@/lib/plans";
import { getAllProfiles, updateUserPlan, updateProfileDetails } from "@/lib/store";
import { PlanTier, Profile } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);

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

  const onSaved = (updated: Profile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
  };

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
            onClick={() => setSelected(profile)}
          />
        ))}
      </div>

      <UserDetailSheet
        profile={selected}
        onClose={() => setSelected(null)}
        onSaved={onSaved}
      />
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
          <CardTitle className="truncate text-sm font-medium">
            {displayName}
          </CardTitle>
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

function UserDetailSheet({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile | null;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const open = profile !== null;
  if (!profile) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-3/4 max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            {profile.business_name || profile.full_name || profile.email || profile.id}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ProfileEditor profile={profile} onSaved={onSaved} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProfileEditor({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
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
      <div className="space-y-2">
        <Label>User ID</Label>
        <p className="break-all text-xs text-muted-foreground">{profile.id}</p>
      </div>

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
