"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Reset a staff member's password.
 *
 * The OWNER picks between:
 *   - "Generate" — server makes a 12-char temporary password.
 *   - Custom    — OWNER types the new password (min 8 chars).
 *
 * The plaintext is shown ONCE inside the dialog after the request
 * succeeds, with a Copy-to-clipboard button. It is not persisted
 * anywhere on the client. Closing the dialog clears the state, so
 * the OWNER must copy or write it down before closing.
 */
interface ResetPasswordModalProps {
  staffMember: {
    userId?: string;
    name?: string;
    fullName?: string;
    email?: string;
  };
  cafeId: string | null;
  customTrigger?: React.ReactNode;
}

export function ResetPasswordModal({
  staffMember,
  cafeId,
  customTrigger,
}: ResetPasswordModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customPwd, setCustomPwd] = useState("");
  const [showPwd, setShowPwd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const reset = (mode: "generate" | "custom") => {
    setCustomPwd("");
    setShowPwd(null);
    setCopied(false);
    void submit(mode);
  };

  const submit = async (mode: "generate" | "custom") => {
    if (!cafeId) {
      toast({ title: "No cafe context", variant: "destructive" });
      return;
    }
    const userId = staffMember.userId;
    if (!userId) {
      toast({ title: "Missing userId", variant: "destructive" });
      return;
    }
    if (mode === "custom" && customPwd.length < 8) {
      toast({
        title: "Password too short",
        description: "Must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const body = mode === "generate" ? { generate: true } : { newPassword: customPwd };
      const res = await fetch(`/api/cafes/${cafeId}/staff/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || (json as { success?: boolean }).success === false) {
        throw new Error(((json as { message?: string }).message) || `HTTP ${res.status}`);
      }
      const data = (json as { data?: { newPassword?: string } }).data ?? {};
      setShowPwd(data.newPassword ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Reset failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!showPwd) return;
    try {
      await navigator.clipboard.writeText(showPwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select and copy manually.", variant: "destructive" });
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Clear all state when dialog closes — never keep the plaintext
      // around between sessions.
      setCustomPwd("");
      setShowPwd(null);
      setCopied(false);
    }
  };

  const displayName = staffMember.name || staffMember.fullName || "this staff member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <div className="flex gap-2 items-center cursor-pointer w-full">
            <Key className="h-4 w-4 text-muted-foreground" /> Reset Password
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-bold">{displayName}</span>{staffMember.email ? ` (${staffMember.email})` : ""}. The new password will be shown once — copy it before closing.
          </DialogDescription>
        </DialogHeader>

        {!showPwd && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="custom-pwd">Set a specific password</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-pwd"
                  type="text"
                  placeholder="At least 8 characters"
                  value={customPwd}
                  onChange={(e) => setCustomPwd(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => submit("custom")}
                  disabled={loading || customPwd.length < 8}
                >
                  Set
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => reset("generate")}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Generate Random Password
            </Button>
          </div>
        )}

        {showPwd && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Copy this now — it will not be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-base border">
                  {showPwd}
                </code>
                <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share via WhatsApp or read out loud to {displayName}. They should change it on first login.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {showPwd ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
