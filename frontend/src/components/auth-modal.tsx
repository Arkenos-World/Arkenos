"use client";

import { useState, useMemo } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { trackSignIn, trackSignUp } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog";

type AuthMode = "sign-in" | "sign-up";

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultMode?: AuthMode;
}

export function AuthModal({ open, onOpenChange, defaultMode = "sign-in" }: AuthModalProps) {
    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset form when mode changes
    function switchMode(newMode: AuthMode) {
        setMode(newMode);
        setError(null);
        setName("");
        setEmail("");
        setPassword("");
    }

    const passwordChecks = useMemo(() => ({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    }), [password]);

    const isPasswordValid = mode === "sign-in" || Object.values(passwordChecks).every(Boolean);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (mode === "sign-up" && !isPasswordValid) {
            setError("Please meet all password requirements");
            return;
        }
        setLoading(true);

        try {
            if (mode === "sign-up") {
                const result = await signUp.email({ name, email, password });
                if (result.error) {
                    setError(result.error.message || "Sign up failed");
                } else {
                    trackSignUp();
                    onOpenChange(false);
                    window.location.href = "/dashboard";
                }
            } else {
                const result = await signIn.email({ email, password });
                if (result.error) {
                    setError(result.error.message || "Sign in failed");
                } else {
                    trackSignIn();
                    onOpenChange(false);
                    window.location.href = "/dashboard";
                }
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-border/80 shadow-2xl shadow-black/40 bg-card animate-[scale-in_0.25s_ease-out]">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl">
                        {mode === "sign-in" ? "Sign In" : "Create Account"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "sign-in"
                            ? "Enter your credentials to access your account"
                            : "Get started with your free Nenyax account"}
                    </DialogDescription>
                </DialogHeader>
                <form key={mode} onSubmit={handleSubmit} className="space-y-4 animate-[slide-up-fade_0.3s_ease-out]">
                    {mode === "sign-up" && (
                        <div className="space-y-2">
                            <Label htmlFor="auth-name">Name</Label>
                            <Input
                                id="auth-name"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="auth-email">Email</Label>
                        <Input
                            id="auth-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="auth-password">Password</Label>
                        <Input
                            id="auth-password"
                            type="password"
                            placeholder={mode === "sign-up" ? "Choose a password" : "Your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        {mode === "sign-up" && password.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                {([
                                    ["length", "8+ characters"],
                                    ["uppercase", "Uppercase letter"],
                                    ["lowercase", "Lowercase letter"],
                                    ["number", "Number"],
                                ] as const).map(([key, label]) => (
                                    <span key={key} className={passwordChecks[key] ? "text-emerald-500" : "text-muted-foreground"}>
                                        {passwordChecks[key] ? "\u2713" : "\u2022"} {label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading || !isPasswordValid}>
                        {loading
                            ? (mode === "sign-in" ? "Signing in..." : "Creating account...")
                            : (mode === "sign-in" ? "Sign In" : "Create Account")}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    {mode === "sign-in" ? (
                        <>
                            Don&apos;t have an account?{" "}
                            <button onClick={() => switchMode("sign-up")} className="text-primary hover:underline">
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button onClick={() => switchMode("sign-in")} className="text-primary hover:underline">
                                Sign In
                            </button>
                        </>
                    )}
                </p>
            </DialogContent>
        </Dialog>
    );
}
