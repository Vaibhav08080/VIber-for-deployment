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
import { useState, useRef, useEffect } from "react";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({ id: projectId }));

    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(project.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: rename, isPending } = useMutation(
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
                    disabled={isPending}
                    className="text-sm font-medium bg-transparent border-b border-primary outline-none w-40 px-1"
                    maxLength={100}
                    autoFocus
                />
                <Button
                    variant="ghost" size="icon"
                    className="size-6"
                    onClick={handleSubmit}
                    disabled={isPending}
                >
                    <CheckIcon className="size-3 text-green-500"/>
                </Button>
                <Button
                    variant="ghost" size="icon"
                    className="size-6"
                    onClick={() => { setDraftName(project.name); setIsEditing(false); }}
                    disabled={isPending}
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
                </DropdownMenuContent>
            </DropdownMenu>
        )}
    </header>
    );
}
