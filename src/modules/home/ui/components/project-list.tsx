"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { PencilIcon, CheckIcon, XIcon, Trash2Icon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

interface RenameInlineProps {
  projectId: string;
  currentName: string;
  onDone: () => void;
}

const RenameInline = ({ projectId, currentName, onDone }: RenameInlineProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: rename, isPending } = useMutation(
    trpc.projects.rename.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
        onDone();
      },
      onError: () => onDone(),
    })
  );

  useEffect(() => {
    setTimeout(() => { inputRef.current?.select(); }, 0);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === currentName) { onDone(); return; }
    rename({ id: projectId, name: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onDone();
  };

  return (
    <div className="flex items-center gap-1 w-full" onClick={(e) => e.preventDefault()}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        disabled={isPending}
        className="text-sm font-medium bg-transparent border-b border-primary outline-none flex-1 min-w-0 px-0.5"
        maxLength={100}
      />
      <button type="button" onClick={(e) => { e.preventDefault(); handleSubmit(); }} disabled={isPending} className="shrink-0 p-0.5 rounded hover:bg-muted">
        <CheckIcon className="size-3 text-green-500"/>
      </button>
      <button type="button" onClick={(e) => { e.preventDefault(); onDone(); }} disabled={isPending} className="shrink-0 p-0.5 rounded hover:bg-muted">
        <XIcon className="size-3 text-muted-foreground"/>
      </button>
    </div>
  );
};

export const ProjectList = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null);

  const { mutate: deleteProject, isPending: isDeleting } = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        setDeletingProject(null);
      },
    })
  );

  if (!user) return null;

  return (
    <>
    <div className="w-full dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4">
      <h2 className="text-2xl font-semibold">{user?.firstName}&apos;s Vibes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">✨</div>
            <p className="font-medium text-sm">No projects yet</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">Describe something above and Vibel will build it for you</p>
          </div>
        )}
        {projects?.map((project) => (
          <div key={project.id} className="relative group">
            <Button
              variant="outline"
              className="font-normal h-auto justify-start w-full text-start p-4 pr-16"
              asChild
            >
              <Link href={`/projects/${project.id}`}>
                <div className="flex items-center gap-x-4 w-full min-w-0">
                  <Image src="/logo.svg" alt="logo" width={32} height={32} className="object-contain shrink-0"/>
                  <div className="flex flex-col min-w-0 flex-1">
                    {renamingId === project.id ? (
                      <RenameInline
                        projectId={project.id}
                        currentName={project.name}
                        onDone={() => setRenamingId(null)}
                      />
                    ) : (
                      <h3 className="truncate font-medium">{project.name}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            {/* Action buttons — show on hover, hidden during rename */}
            {renamingId !== project.id && (
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Rename project"
                  className="p-1.5 rounded-md hover:bg-muted"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenamingId(project.id); }}
                >
                  <PencilIcon className="size-3.5 text-muted-foreground"/>
                </button>
                <button
                  type="button"
                  title="Delete project"
                  className="p-1.5 rounded-md hover:bg-destructive/10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProject({ id: project.id, name: project.name }); }}
                >
                  <Trash2Icon className="size-3.5 text-destructive"/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Delete confirmation dialog */}
    <AlertDialog open={!!deletingProject} onOpenChange={(open) => { if (!open) setDeletingProject(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{deletingProject?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this project along with all its messages and generated code. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deletingProject && deleteProject({ id: deletingProject.id })}
          >
            {isDeleting ? "Deleting..." : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
