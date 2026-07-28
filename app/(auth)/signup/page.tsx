"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { AppFooter } from "@/components/layout/app-footer";

export default function SignupPage() {
  const { signUp } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const message = await signUp(email.trim(), password, {
      business_name: businessName.trim(),
      full_name: fullName.trim(),
      contact_number: contactNumber.trim(),
      address: address.trim(),
    });
    if (message) setError(message);
    else setSuccess(true);
  };

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">iNegosyo</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to {email.trim()}. Check your inbox to confirm
              your account, then{" "}
              <Link href="/login" className="text-primary hover:underline">
                log in
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={(v) => setEmail(v)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onValueChange={(v) => setPassword(v)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-0 top-0 h-full px-2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
      <AppFooter />
    </div>
  );
}
