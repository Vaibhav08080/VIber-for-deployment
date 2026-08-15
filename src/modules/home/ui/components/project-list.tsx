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
import { toast } from "sonner";
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
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === currentName) {
      onDone();
      return;
    }
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
        className="text-sm font-medium bg-transparent border-b border-[#FF6A3D] outline-none flex-1 min-w-0 px-0.5 text-[#090909] dark:text-[#e3e2e2]"
        maxLength={100}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        disabled={isPending}
        className="shrink-0 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-[#292a2a]"
      >
        <CheckIcon className="size-3 text-emerald-500" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onDone();
        }}
        disabled={isPending}
        className="shrink-0 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-[#292a2a]"
      >
        <XIcon className="size-3 text-neutral-400 dark:text-[#8e9192]" />
      </button>
    </div>
  );
};

export const ProjectList = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();

  const { data: projects } = useQuery({
    ...trpc.projects.getMany.queryOptions(),
    enabled: !!user,
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const { mutate: deleteProject, isPending: isDeleting } = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        setDeletingProject(null);
        toast.success("Project deleted");
      },
    })
  );

  const { mutate: deleteAllProjects, isPending: isDeletingAll } = useMutation(
    trpc.projects.deleteAll.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        setShowDeleteAllDialog(false);
        toast.success("Deleted all projects");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete all projects");
      },
    })
  );

  if (!isLoaded || !user) return null;

  return (
    <>
      <div className="w-full rounded-3xl p-6 md:p-8 border border-neutral-200/90 dark:border-[#444748]/30 flex flex-col gap-y-6 max-w-5xl mx-auto my-12 bg-white/95 dark:bg-[#121414]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-[#444748]/20 pb-4">
          <h2 className="text-xl md:text-2xl font-extrabold font-['Sora'] tracking-tight text-[#090909] dark:text-[#e3e2e2]">
            {user?.firstName}&apos;s Projects
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#FF6A3D] uppercase tracking-widest bg-[#FF6A3D]/10 dark:bg-[#ab2f01]/20 px-3 py-1 rounded-full border border-[#FF6A3D]/30 font-bold">
              {projects?.length || 0} Saved
            </span>
            {!!projects && projects.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                title="Delete all projects"
              >
                <Trash2Icon className="size-3.5" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {projects?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="size-14 rounded-2xl bg-neutral-100 dark:bg-[#1e2020] border border-neutral-200 dark:border-[#444748]/30 flex items-center justify-center text-2xl">
                ✨
              </div>
              <p className="font-bold text-sm text-[#090909] dark:text-[#e3e2e2]">No projects yet</p>
              <p className="text-xs text-neutral-600 dark:text-[#8e9192] max-w-[240px]">
                Describe your application above and SparkSite will generate it for you.
              </p>
            </div>
          )}
          {projects?.map((project) => (
            <div key={project.id} className="relative group">
              <Button
                variant="outline"
                className="font-normal h-auto justify-start w-full text-start p-4 pr-16 bg-white dark:bg-[#121414]/80 border-neutral-200/90 dark:border-[#444748]/30 hover:border-[#FF6A3D] hover:bg-neutral-50/60 dark:hover:bg-[#1a1c1c] transition-all rounded-2xl shadow-xs hover:shadow-md"
                asChild
              >
                <Link href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-x-3.5 w-full min-w-0">
                    <Image
                      src="/logo.svg"
                      alt="logo"
                      width={30}
                      height={30}
                      className="object-contain shrink-0 brightness-110 dark:brightness-125"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      {renamingId === project.id ? (
                        <RenameInline
                          projectId={project.id}
                          currentName={project.name}
                          onDone={() => setRenamingId(null)}
                        />
                      ) : (
                        <h3 className="truncate font-semibold text-sm text-[#090909] dark:text-[#e3e2e2] group-hover:text-[#FF6A3D] transition-colors">
                          {project.name}
                        </h3>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-[#8e9192] font-mono mt-0.5">
                        {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              {/* Action buttons */}
              {renamingId !== project.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Rename project"
                    className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-[#292a2a] text-neutral-600 dark:text-[#8e9192] hover:text-[#090909] dark:hover:text-[#e3e2e2] transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenamingId(project.id);
                    }}
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete project"
                    className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject({ id: project.id, name: project.name });
                    }}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete single project confirmation dialog */}
      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-[#121414] border-neutral-200 dark:border-[#444748]/50 text-[#090909] dark:text-[#e3e2e2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Sora']">Delete &quot;{deletingProject?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600 dark:text-[#8e9192]">
              This will permanently delete this project along with all its messages and generated code. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-neutral-200 dark:border-[#444748]/50 text-[#090909] dark:text-[#e3e2e2] hover:bg-neutral-100 dark:hover:bg-[#292a2a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => deletingProject && deleteProject({ id: deletingProject.id })}
            >
              {isDeleting ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete ALL projects confirmation dialog */}
      <AlertDialog
        open={showDeleteAllDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteAllDialog(false);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-[#121414] border-rose-200 dark:border-rose-900/40 text-[#090909] dark:text-[#e3e2e2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Sora'] text-rose-600 dark:text-rose-400">
              Delete All {projects?.length} Projects?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600 dark:text-[#8e9192]">
              This will permanently delete all <strong className="text-[#090909] dark:text-[#e3e2e2]">{projects?.length}</strong> of your projects, including all generated code, messages, and history. This action CANNOT be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll} className="border-neutral-200 dark:border-[#444748]/50 text-[#090909] dark:text-[#e3e2e2] hover:bg-neutral-100 dark:hover:bg-[#292a2a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingAll}
              className="bg-rose-600 text-white hover:bg-rose-700 font-bold"
              onClick={() => deleteAllProjects()}
            >
              {isDeletingAll ? "Deleting All..." : `Delete All ${projects?.length} Projects`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
