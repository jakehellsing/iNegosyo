"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { PLAN_LABELS } from "@/lib/plans";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, plan, updateProfile } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name ?? "");
      setFullName(profile.full_name ?? "");
      setContactNumber(profile.contact_number ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const message = await updateProfile({
      business_name: businessName.trim(),
      full_name: fullName.trim(),
      contact_number: contactNumber.trim(),
      address: address.trim(),
    });

    setLoading(false);
    if (message) setError(message);
    else setSaved(true);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Your email is tied to your Supabase account and cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Mang Juan's Sari-Sari Store"
                value={businessName}
                onValueChange={(v) => setBusinessName(v)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Juan dela Cruz"
                value={fullName}
                onValueChange={(v) => setFullName(v)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="09171234567"
                value={contactNumber}
                onValueChange={(v) => setContactNumber(v)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Manila, Philippines"
                value={address}
                onValueChange={(v) => setAddress(v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <div>
                <Badge variant={plan === "free" ? "outline" : "default"}>
                  {PLAN_LABELS[plan]}
                </Badge>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && (
              <p className="text-sm text-green-600">Profile saved successfully.</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
