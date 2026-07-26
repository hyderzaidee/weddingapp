"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeddingBackdrop } from "@/components/wedding-backdrop";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Incorrect passcode, try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="wedding-shell flex min-h-screen items-center justify-center px-4">
      <WeddingBackdrop />
      <div className="wedding-panel relative z-10 w-full max-w-sm rounded-2xl border p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Heart className="size-5 fill-current" />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Wedding Prep
          </h1>
          <div className="desi-divider mx-auto my-3 w-24" />
          <p className="text-sm text-muted-foreground">
            Family passcode — shadi ki tayari starts here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              name="passcode"
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              required
              autoFocus
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Checking…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
