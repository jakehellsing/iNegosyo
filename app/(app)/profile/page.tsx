"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { PLAN_LABELS } from "@/lib/plans";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, plan } = useAuth();

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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your email is tied to your Supabase account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={profile?.business_name ?? ""}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={profile?.full_name ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={profile?.contact_number ?? ""}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={profile?.address ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <div>
              <Badge variant={plan === "free" ? "outline" : "default"}>
                {PLAN_LABELS[plan]}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Need changes? Contact an admin to update your profile details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
