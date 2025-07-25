
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useRef } from "react";
import { useEffect } from "react";
import { Fragment } from "@prisma/client";
import { MessageLoading } from "./message-loading";
interface Props{
    projectId:string;
    activeFragment:Fragment | null;
    SetActiveFragment: (fragment: Fragment | null) => void;
}
export const MessagesContainer = ({projectId , activeFragment , SetActiveFragment}:Props) => {
    const BottomRef =useRef<HTMLDivElement>(null)
    const lastAssistantMessageRef =useRef<string | null>(null)
    const trpc = useTRPC()
    const {data:messages} = useSuspenseQuery(trpc.messages.getMany.queryOptions({
        projectId,
        

    }
)
    );
    useEffect(() => {
        const lastAssistantMessage = messages.findLast((message)=>message.role === "ASSISTANT");
        if (lastAssistantMessage?.fragment){
            lastAssistantMessageRef.current = lastAssistantMessage.id;
        }
        },[messages , SetActiveFragment]);

    useEffect(() => {
    // Only auto-select last assistant fragment if nothing is selected
    if (!activeFragment) {
        const lastAssistantMessage = messages.findLast((message) => message.role === "ASSISTANT" && message.fragment);
        if (lastAssistantMessage?.fragment) {
            SetActiveFragment(lastAssistantMessage.fragment);
            lastAssistantMessageRef.current = lastAssistantMessage.id;
        }
    }
}, [messages, activeFragment, SetActiveFragment]);

    useEffect(()=>{
        BottomRef.current?.scrollIntoView()
    },[messages.length])   
    
    
    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage.role === "USER";


    return(
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="pt-2 pr-1">
                    {messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            content={message.content}
                            role={message.role}
                            type={message.type}
                            fragment={message.fragment}
                            CreatedAt={message.createdAt}
                            isActiveFragment={activeFragment?.id === message.fragment?.id}
                            onFragmentClick={(fragment) => SetActiveFragment(fragment)}
                            
                        />
                    ))}
                    {isLastMessageUser && <MessageLoading/>}

                    <div ref={BottomRef}/>
                </div>
            </div>
            <div className="relative p-3 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none"></div>
                <MessageForm projectId={projectId}/>
            </div>
        </div>
       
       
    )
}



 // ---
    // [Cascade AI] Why we don't use lastAssistantMessageRef:
    // The lastAssistantMessageRef was previously used to store the last assistant message's id,
    // but it was never read or used for any UI effect. In React, to select and highlight the last fragment,
    // you should update state (via SetActiveFragment) instead of using a ref. This ensures the UI updates as intended.
    // The effect below correctly auto-selects the last assistant fragment whenever messages change.
    // ---  [cascade AI] this is the file remember to remove this comment