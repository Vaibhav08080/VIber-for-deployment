"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DatabaseIcon,
  CheckCircle2Icon,
  Loader2Icon,
  UnlinkIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";

interface Props {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal = ({ projectId, projectName, isOpen, onClose }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");

  const { data: status, isLoading } = useQuery({
    ...trpc.supabase.getStatus.queryOptions({ projectId }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (status?.supabaseUrl) {
      setUrl(status.supabaseUrl);
    }
  }, [status]);

  const saveMutation = useMutation({
    ...trpc.supabase.saveCredentials.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.supabase.getStatus.queryKey({ projectId }),
      });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save Supabase connection.");
    },
  });

  const disconnectMutation = useMutation({
    ...trpc.supabase.disconnect.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      setUrl("");
      setAnonKey("");
      queryClient.invalidateQueries({
        queryKey: trpc.supabase.getStatus.queryKey({ projectId }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect Supabase.");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      toast.error("Please enter both Supabase URL and Anon Key.");
      return;
    }
    saveMutation.mutate({
      projectId,
      supabaseUrl: url.trim(),
      supabaseAnonKey: anonKey.trim(),
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate({ projectId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass-panel bg-white dark:bg-[#121414] border border-black/10 dark:border-[#444748]/40 shadow-2xl rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DatabaseIcon className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-['Sora'] text-xl font-bold text-[#090909] dark:text-[#e3e2e2]">
                Connect Supabase
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 dark:text-[#a0a4a4]">
                Link your Supabase account to offload database storage &amp; compute directly to your cloud.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2Icon className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs text-neutral-500">Checking connection status...</span>
          </div>
        ) : status?.isConnected ? (
          <div className="space-y-6 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  Supabase Database Connected
                </p>
                <p className="text-neutral-600 dark:text-neutral-300 mt-1 font-mono break-all">
                  {status.supabaseUrl}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                  Key: {status.supabaseAnonKey}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-600 dark:text-[#c4c7c7] flex items-center gap-1.5">
                <ZapIcon className="w-4 h-4 text-emerald-500" />
                Active Integration Benefits
              </h4>
              <ul className="text-xs space-y-1.5 text-neutral-500 dark:text-neutral-400 list-disc pl-4">
                <li>All generated app data lives directly in your Supabase database.</li>
                <li>Zero database host limits or extra compute charges on SparkSite.</li>
                <li>AI automatically injects real `@supabase/supabase-js` database queries.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="w-full h-11 rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10 font-medium text-xs flex items-center justify-center gap-2"
              >
                {disconnectMutation.isPending ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UnlinkIcon className="w-4 h-4" />
                    Disconnect Supabase
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-[#c4c7c7]">
                Supabase Project URL
              </Label>
              <Input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="h-11 rounded-xl border-black/10 dark:border-[#444748]/50 bg-white dark:bg-[#1a1d1d] text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-[#c4c7c7]">
                Supabase Public Anon Key
              </Label>
              <Input
                type="password"
                placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                required
                className="h-11 rounded-xl border-black/10 dark:border-[#444748]/50 bg-white dark:bg-[#1a1d1d] text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-[#1c1f1f] text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Your keys are stored securely per project and used exclusively for your app database.</span>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-11 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 flex items-center gap-2 cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <DatabaseIcon className="w-4 h-4" />
                    Save &amp; Connect
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
