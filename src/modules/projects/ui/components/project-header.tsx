"use client";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { GitHubExportModal } from "./github-export-modal";
import { SupabaseModal } from "./supabase-modal";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  SunMoonIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
  GithubIcon,
  DatabaseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "./hint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({ id: projectId }));
    const { data: supabaseStatus } = useQuery(trpc.supabase.getStatus.queryOptions({ projectId }));

    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(project.name);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [showSupabaseModal, setShowSupabaseModal] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: rename, isPending: isRenaming } = useMutation(
        trpc.projects.rename.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
                queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
                setIsEditing(false);
            },
            onError: () => {
                setDraftName(project.name);
                setIsEditing(false);
            },
        })
    );

    const { mutate: deleteProject, isPending: isDeleting } = useMutation(
        trpc.projects.delete.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
                router.push("/");
            },
        })
    );

    useEffect(() => {
        if (isEditing) {
            setDraftName(project.name);
            setTimeout(() => inputRef.current?.select(), 0);
        }
    }, [isEditing, project.name]);

    const handleSubmit = () => {
        const trimmed = draftName.trim();
        if (!trimmed || trimmed === project.name) {
            setIsEditing(false);
            return;
        }
        rename({ id: projectId, name: trimmed });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") {
            setDraftName(project.name);
            setIsEditing(false);
        }
    };

    return (
    <>
    <header className="p-2 border-b bg-sidebar flex items-center justify-between gap-x-2">
        {isEditing ? (
            <div className="flex items-center gap-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRenaming}
                    className="h-7 px-2 text-sm font-medium bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-ring w-40 sm:w-56"
                />
                <Button size="sm" variant="ghost" onClick={handleSubmit} disabled={isRenaming} className="size-7 p-0">
                    <CheckIcon className="size-3.5 text-emerald-500"/>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraftName(project.name); setIsEditing(false); }} disabled={isRenaming} className="size-7 p-0">
                    <XIcon className="size-3.5 text-muted-foreground"/>
                </Button>
            </div>
        ) : (
            <div className="flex items-center gap-x-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!">
                            <Image src="/logo.svg" alt="SparkSite" width={18} height={18} className="shrink-0"/>
                            <span className="text-sm font-medium">{project.name}</span>
                            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                        <DropdownMenuItem asChild>
                            <Link href="/">
                                <ChevronLeftIcon className="mr-2 h-4 w-4 shrink-0 opacity-50"/>
                                <span>Go to Home</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <PencilIcon className="mr-2 h-4 w-4 shrink-0 opacity-50"/>
                            <span>Rename project</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowGithubModal(true)}>
                            <GithubIcon className="mr-2 h-4 w-4 shrink-0 opacity-50"/>
                            <span>Export / Sync to GitHub</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowSupabaseModal(true)}>
                            <DatabaseIcon className="mr-2 h-4 w-4 shrink-0 opacity-50 text-emerald-500"/>
                            <span>Supabase Connection</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                                <SunMoonIcon className="size-4 text-muted-foreground"/>
                                <span>Appearance</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                        <DropdownMenuRadioItem value="light"><span>Light</span></DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="dark"><span>Dark</span></DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="system"><span>System</span></DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Trash2Icon className="mr-2 h-4 w-4 shrink-0"/>
                            <span>Delete project</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Hint text={supabaseStatus?.isConnected ? "Supabase Cloud Database Connected ⚡" : "Connect project to Supabase database"} side="bottom">
                    <Button
                        size="sm"
                        variant={supabaseStatus?.isConnected ? "secondary" : "outline"}
                        onClick={() => setShowSupabaseModal(true)}
                        className={`gap-1.5 text-xs h-7 px-2 font-mono transition-all ${
                          supabaseStatus?.isConnected ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : ""
                        }`}
                    >
                        <DatabaseIcon className="size-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">
                            {supabaseStatus?.isConnected ? "Supabase" : "Supabase"}
                        </span>
                    </Button>
                </Hint>

                <Hint text={project.githubRepo ? "GitHub Repo Synced ⚡" : "Export project to GitHub 🐙"} side="bottom">
                    <Button
                        size="sm"
                        variant={project.githubRepo ? "secondary" : "outline"}
                        onClick={() => setShowGithubModal(true)}
                        className="gap-1.5 text-xs h-7 px-2 font-mono transition-all"
                    >
                        <GithubIcon className="size-3.5" />
                        <span className="hidden sm:inline">
                            {project.githubRepo ? "GitHub Synced" : "GitHub"}
                        </span>
                    </Button>
                </Hint>
            </div>
        )}
    </header>

    {/* Supabase Connection Modal */}
    <SupabaseModal
        projectId={projectId}
        projectName={project.name}
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
    />

    {/* GitHub Export Modal */}
    <GitHubExportModal
        projectId={projectId}
        projectName={project.name}
        isOpen={showGithubModal}
        onClose={() => setShowGithubModal(false)}
    />

    {/* Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{project.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this project along with all its messages and generated code. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => deleteProject({ id: projectId })}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    {isDeleting ? "Deleting..." : "Delete project"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
    );
}
