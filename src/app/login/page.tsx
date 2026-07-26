"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="relative flex min-h-dvh items-end justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:pb-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#b7aea6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
        />
      </div>

      <div className="relative z-10 mb-2 w-full max-w-sm rounded-2xl border border-white/35 bg-white/15 p-6 shadow-lg backdrop-blur-[2px] sm:mb-0 sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Heart className="size-5 fill-current" />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
            Hira Wedding Prep
          </h1>
          <div className="desi-divider mx-auto my-3 w-24" />
          <p className="text-sm text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            Family passcode — shadi ki tayari starts here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="text-white drop-shadow-sm">
              Passcode
            </Label>
            <Input
              id="passcode"
              name="passcode"
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              required
              autoFocus
              className="h-11 border-white/50 bg-white/25 text-foreground placeholder:text-foreground/50"
            />
          </div>

          {error ? (
            <p
              className="rounded-md bg-black/35 px-2 py-1 text-sm text-red-100"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Checking…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
