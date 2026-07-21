import { MessageRole, Fragment, MessageType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { Code2Icon, ChevronRightIcon, CheckCircle2Icon, HistoryIcon } from "lucide-react";

interface UserMessageProps{
    content:string;
}

const UserMessage = ({content}:UserMessageProps)=>{
    return(
        <div className="flex justify-end pb-4 pr-2 pl-10">
            <Card className="rounded-lg bg-muted dark:bg-zinc-800 p-3 shadow-none border-none max-w-[80%] break-words">
                {content}
            </Card>
        </div>
    )
}

interface FragmentCardProps{
    fragment: Fragment;
    isActiveFragment:boolean;
    onFragmentClick: (fragment: Fragment) => void;
};

const FragmentCard =({
    fragment,
    isActiveFragment,
    onFragmentClick
}:FragmentCardProps)=>{
    return(
       <button
       className={cn(
        "flex items-start text-start gap-2 border rounded-lg w-fit p-3 transition-all duration-200",
        isActiveFragment
          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/80"
          : "bg-muted hover:bg-secondary hover:border-primary/40 group"
       )}
       onClick={()=>onFragmentClick(fragment)}
    >
        <Code2Icon className="size-4 mt-0.5 shrink-0"/>
        <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium line-clamp-1">{fragment.title}</span>
            {isActiveFragment ? (
                <span className="text-xs flex items-center gap-1 mt-0.5 opacity-80">
                    <CheckCircle2Icon className="size-3"/> Current version
                </span>
            ) : (
                <span className="text-xs flex items-center gap-1 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <HistoryIcon className="size-3"/> Click to restore this version
                </span>
            )}
        </div>
        <div className="flex items-center justify-center mt-0.5">
            {isActiveFragment
              ? <CheckCircle2Icon className="size-4"/>
              : <ChevronRightIcon className="size-4 opacity-60 group-hover:opacity-100 transition-opacity"/>
            }
        </div>
    </button>
)}

interface AssistantMessageProps{
    content:string;
    fragment: Fragment | null;
    CreatedAt:Date;
    isActiveFragment:boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type:MessageType;
}

const AssistantMessage =({
    content,
    fragment,
    CreatedAt,
    isActiveFragment,
    onFragmentClick,
    type
}:AssistantMessageProps)=>{
    return(
        <div className={cn(
            "flex flex-col group px-2 pb-4",
            type ==="ERROR" && "text-red-700 dark:text-red-500"
        )}>
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image src="/logo.svg" alt="Vibel" width={18} height={18} className="shrink-0"/>
                <span className="text-sm font-medium">Vibel</span>
                <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {format(CreatedAt, "HH:mm 'on' MMM dd, yyyy")}
                </span>
            </div>
            <Card className={cn(
                "rounded-lg bg-white dark:bg-zinc-900 p-3 shadow-none border-none max-w-[80%] break-words",
                type === "ERROR" && "text-red-700 dark:text-red-500"
            )}>
                {content}
            </Card>
            {fragment && type === "RESULT" &&(
                <div className="mt-2">
                    <FragmentCard
                        fragment={fragment}
                        isActiveFragment={isActiveFragment}
                        onFragmentClick={onFragmentClick}
                    />
                </div>
            )}
        </div>
    )
}

interface MessageCardProps{
    content:string;
    role:MessageRole;
    fragment: Fragment | null;
    CreatedAt:Date;
    isActiveFragment:boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type:MessageType;
}

export const MessageCard=({
    content,
    role,
    fragment,
    CreatedAt,
    isActiveFragment,
    onFragmentClick,
    type
}:MessageCardProps)=>{
    if (role === "ASSISTANT")
        return(
            <AssistantMessage
                content={content}
                fragment={fragment}
                CreatedAt={CreatedAt}
                isActiveFragment={isActiveFragment}
                onFragmentClick={onFragmentClick}
                type={type}
            />
        )
    return(
        <UserMessage content={content}/>
    )
}