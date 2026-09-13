import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef } from "react";
import { Fragment } from "@prisma/client";

interface Props{
    projectId:string;
    activeFragment:Fragment | null;
    SetActiveFragment: (fragment: Fragment | null) => void;
}
export const MessagesContainer = ({projectId , activeFragment , SetActiveFragment}:Props) => {
    const BottomRef = useRef<HTMLDivElement>(null)
    const trpc = useTRPC()
    const {data:messages} = useSuspenseQuery({
        ...trpc.messages.getMany.queryOptions({ projectId }),
        refetchInterval: (query) => {
            const msgs = query.state.data;
            if (!msgs || msgs.length === 0) return false;
            const last = msgs[msgs.length - 1];
            // Poll every 3s while waiting for AI response
            return last.role === "USER" ? 3000 : false;
        },
    });


    useEffect(() => {
    // Always auto-select the LATEST assistant fragment
    const lastAssistantMessage = messages.findLast((message) => message.role === "ASSISTANT" && message.fragment);
    if (lastAssistantMessage?.fragment) {
        if (!activeFragment || activeFragment.id !== lastAssistantMessage.fragment.id) {
            SetActiveFragment(lastAssistantMessage.fragment);
        }
    }
}, [messages]);

    useEffect(()=>{
        BottomRef.current?.scrollIntoView()
    },[messages.length])   
    

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const isLastMessageUser = lastMessage?.role === "USER";


    return(
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="pt-2 pr-1">
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            content={message.content}
                            imageUrl={message.imageUrl}
                            mode={message.mode}
                            role={message.role}
                            type={message.type}
                            fragment={message.fragment}
                            CreatedAt={message.createdAt}
                            isActiveFragment={activeFragment?.id === message.fragment?.id}
                            onFragmentClick={(fragment) => SetActiveFragment(fragment)}
                            
                        />
                    ))}
                    {isLastMessageUser && (
                        <div className="flex items-center gap-2 px-4 pb-4">
                            <div className="size-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            <span className="text-sm text-muted-foreground animate-pulse">SparkSite is working...</span>
                        </div>
                    )}

                    <div ref={BottomRef}/>
                </div>
            </div>
            <div className="relative p-3 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none"></div>
                <MessageForm projectId={projectId} isFirstMessage={messages.length === 0}/>
            </div>
        </div>
       
       
    )
}