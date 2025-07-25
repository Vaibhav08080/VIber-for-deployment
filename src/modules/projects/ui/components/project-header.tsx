import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  SunMoonIcon,
} from "lucide-react";
import {Button} from "@/components/ui/button";
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


interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { theme, setTheme } = useTheme();
    const {data:project} = useSuspenseQuery(trpc.projects.getOne.queryOptions({
        id:projectId,
    })
    );
    return(
    <header className="p-2 flex justify-between items-center border-b">
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
                <DropdownMenuSeparator/>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                        <SunMoonIcon className="size-4 text-muted-foreground"/>
                        <span>Appearence</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
    <DropdownMenuRadioItem value="light">
        <span>Light</span>
    </DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="dark">
        <span>Dark</span>
    </DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="system">
        <span>System</span>
    </DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
    );
}
