"use client";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  SunMoonIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(project.name);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    <header className="p-2 flex justify-between items-center border-b">
        {isEditing ? (
            <div className="flex items-center gap-1 pl-2">
                <Image src="/logo.svg" alt="Vibe" width={18} height={18} className="shrink-0"/>
                <input
                    ref={inputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSubmit}
                    disabled={isRenaming}
                    className="text-sm font-medium bg-transparent border-b border-primary outline-none w-40 px-1"
                    maxLength={100}
                    autoFocus
                />
                <Button
                    variant="ghost" size="icon"
                    className="size-6"
                    onClick={handleSubmit}
                    disabled={isRenaming}
                >
                    <CheckIcon className="size-3 text-green-500"/>
                </Button>
                <Button
                    variant="ghost" size="icon"
                    className="size-6"
                    onClick={() => { setDraftName(project.name); setIsEditing(false); }}
                    disabled={isRenaming}
                >
                    <XIcon className="size-3 text-muted-foreground"/>
                </Button>
            </div>
        ) : (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!">
                        <Image src="/logo.svg" alt="Vibe" width={18} height={18} className="shrink-0"/>
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
        )}
    </header>

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
