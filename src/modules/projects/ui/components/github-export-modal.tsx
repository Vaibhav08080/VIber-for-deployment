"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  GithubIcon,
  ExternalLinkIcon,
  Loader2Icon,
  CheckCircle2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  RocketIcon,
} from "lucide-react";

import { useClerk, useUser } from "@clerk/nextjs";

interface Props {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal = ({ projectId, projectName, isOpen, onClose }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const { user } = useUser();
  const [isLinking, setIsLinking] = useState(false);

  const sanitizedDefaultRepoName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");

  const [repoName, setRepoName] = useState(sanitizedDefaultRepoName);
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch GitHub connection status & existing project repo
  const { data: status, isLoading: isStatusLoading } = useQuery({
    ...trpc.github.getStatus.queryOptions({ projectId }),
    enabled: isOpen,
  });

  const handleConnectGitHub = async () => {
    if (!user) {
      clerk.openSignIn();
      return;
    }
    setIsLinking(true);
    try {
      const res = await user.createExternalAccount({
        strategy: "oauth_github",
        redirectUrl: window.location.href,
      });
      if (res.verification?.externalVerificationRedirectURL) {
        window.location.href = res.verification.externalVerificationRedirectURL.href;
      } else {
        setIsLinking(false);
      }
    } catch (err: any) {
      setIsLinking(false);
      const msg = err?.errors?.[0]?.message || "Could not connect GitHub.";
      toast.error(msg);
    }
  };

  const exportMutation = useMutation(
    trpc.github.exportRepo.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Exported to GitHub! 🚀 (${data.fullName})`);
        queryClient.invalidateQueries(trpc.github.getStatus.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
      },
      onError: (err) => {
        toast.error(err.message || "Failed to export repository to GitHub.");
      },
    })
  );

  const handleExport = async () => {
    if (!repoName.trim()) {
      toast.error("Please enter a valid repository name.");
      return;
    }
    await exportMutation.mutateAsync({
      projectId,
      repoName: repoName.trim(),
      isPrivate,
    });
  };

  const isExporting = exportMutation.isPending;
  const isConnected = status?.isConnected ?? false;
  const githubUser = status?.user;
  const existingRepoUrl = status?.projectGithubUrl;
  const existingRepoName = status?.projectGithubRepo;

  // Generate Vercel 1-click deploy URL
  const vercelDeployUrl = existingRepoUrl
    ? `https://vercel.com/new/clone?repository-url=${encodeURIComponent(existingRepoUrl)}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground dark:bg-zinc-950 border border-border/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-xl bg-foreground/5 dark:bg-foreground/10 border border-border">
              <GithubIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">GitHub & Vercel Deploy</DialogTitle>
              <DialogDescription className="text-xs">
                Export your app code to GitHub and deploy live to Vercel in 1 click.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isStatusLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin text-[var(--primary)]" />
            <span className="text-xs">Checking GitHub connection...</span>
          </div>
        ) : !isConnected ? (
          /* GitHub Not Connected Alert */
          <div className="flex flex-col gap-3 py-2">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
                <ShieldCheckIcon className="size-4 shrink-0" />
                <span>GitHub Account Not Connected</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your GitHub account to enable automatic repository creation, code export, and 1-click Vercel deployments.
              </p>
            </div>

            {/* Direct GitHub OAuth Link Button */}
            <Button
              variant="default"
              disabled={isLinking}
              className="w-full gap-2 bg-[#24292e] hover:bg-[#1b1f23] text-white h-10 text-xs font-semibold shadow-sm"
              onClick={handleConnectGitHub}
            >
              {isLinking ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <GithubIcon className="size-4" />
              )}
              <span>Connect GitHub Account</span>
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2 text-xs border-border hover:bg-muted text-muted-foreground"
              onClick={() => {
                onClose();
                clerk.openUserProfile();
              }}
            >
              <span>Manage Connected Accounts</span>
            </Button>

            <div className="p-3 rounded-lg border border-border bg-muted/30 text-[11px] text-muted-foreground flex flex-col gap-1">
              <span className="font-semibold text-foreground">💡 Setup Note (Clerk Dashboard):</span>
              <span>If GitHub isn&apos;t listed, enable GitHub under <strong>Clerk Dashboard → Social Connections → GitHub</strong> and check the <code>repo</code> scope.</span>
            </div>
          </div>
        ) : (
          /* Connected View */
          <div className="flex flex-col gap-4 py-2">
            {/* Account Badge */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/80 dark:bg-zinc-900 border border-border text-xs">
              <div className="flex items-center gap-2">
                {githubUser?.avatar_url && (
                  <img
                    src={githubUser.avatar_url}
                    alt={githubUser.login}
                    className="size-6 rounded-full border border-border"
                  />
                )}
                <span className="font-medium text-foreground">
                  {githubUser?.name || githubUser?.login}
                </span>
                <span className="text-muted-foreground font-mono">@{githubUser?.login}</span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2Icon className="size-3" /> Connected
              </span>
            </div>

            {existingRepoUrl ? (
              /* Already Exported / Synced View */
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2Icon className="size-4" /> Connected & Auto-Sync Enabled
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Repository: <span className="font-mono text-foreground font-medium">{existingRepoName}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ⚡ Future AI code changes on this project will auto-push directly to this repo!
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-xs h-9"
                    onClick={() => window.open(existingRepoUrl, "_blank")}
                  >
                    <GithubIcon className="size-3.5" />
                    <span>View Repository</span>
                    <ExternalLinkIcon className="size-3" />
                  </Button>

                  <Button
                    variant="default"
                    disabled={isExporting}
                    onClick={handleExport}
                    className="gap-1.5 text-xs h-9 bg-[var(--primary)] hover:bg-[#ff8a6d] text-white"
                  >
                    {isExporting ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="size-3.5" />
                    )}
                    <span>Sync Now</span>
                  </Button>
                </div>

                {/* Vercel 1-Click Deploy Banner */}
                {vercelDeployUrl && (
                  <div className="mt-2 p-3 rounded-xl bg-black dark:bg-zinc-900 border border-zinc-800 text-white flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <RocketIcon className="size-4 text-[var(--primary)]" /> Deploy to Vercel
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                        1-Click Setup
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Deploy your live GitHub repository directly to Vercel with automated CI/CD builds.
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-2 bg-white text-black hover:bg-zinc-200 font-semibold text-xs h-9 mt-1"
                      onClick={() => window.open(vercelDeployUrl, "_blank")}
                    >
                      <svg className="size-3.5 fill-current" viewBox="0 0 76 65">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                      </svg>
                      <span>Deploy on Vercel</span>
                      <ExternalLinkIcon className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Initial Export Form */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="repo-name" className="text-xs font-medium">
                    Repository Name
                  </Label>
                  <Input
                    id="repo-name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-awesome-app"
                    className="font-mono text-xs h-9"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">Private Repository</span>
                    <span className="text-[11px] text-muted-foreground">
                      {isPrivate ? "Only you can see this repo" : "Anyone on GitHub can see this repo"}
                    </span>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>

                <Button
                  variant="default"
                  disabled={isExporting || !repoName.trim()}
                  onClick={handleExport}
                  className="w-full gap-2 text-xs h-9 bg-[var(--primary)] hover:bg-[#ff8a6d] text-white"
                >
                  {isExporting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      <span>Exporting to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <GithubIcon className="size-4" />
                      <span>Export to Personal GitHub</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
