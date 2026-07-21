"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
interface Props {
  projectId: string;
}
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessagesContainer } from "../components/messages-container";
import { Suspense } from "react";
import { useState } from "react";
import { Fragment } from "@prisma/client";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { EyeIcon , CodeIcon, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";
import { useAuth } from "@clerk/nextjs";
export const ProjectView = ({ projectId }: Props) => {
     const {has} =useAuth();
      const hasProAccess = has?.({plan:"pro"});
  const [activeFragment, SetActiveFragment] = useState<Fragment | null>(null);
  const [tabstate, setTabstate] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={
            <div className="p-3 border-b flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
          }>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={
            <div className="flex flex-col gap-3 p-4 flex-1">
              <div className="h-16 w-3/4 rounded-xl bg-muted animate-pulse" />
              <div className="h-12 w-1/2 rounded-xl bg-muted animate-pulse self-end" />
              <div className="h-16 w-2/3 rounded-xl bg-muted animate-pulse" />
              <div className="h-12 w-1/2 rounded-xl bg-muted animate-pulse self-end" />
            </div>
          }>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              SetActiveFragment={SetActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors"/>
        <ResizablePanel
          defaultSize={65}
          minSize={50}
          className="flex flex-col min-h-0"
        >
          <Tabs
            className="h-full gap-y-0"
            value={tabstate}
            onValueChange={(value) => setTabstate(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>code</span>
                </TabsTrigger>
                
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess &&(
                    <Button asChild size="sm" variant="tertiary">
                        <Link href="/pricing">
                           <CrownIcon/> Upgrade
                        </Link>
                    </Button>
                )}
                <UserControl />
              </div>
             
            </div>
            <TabsContent value="preview" className="h-full">
            {!!activeFragment ? (
              <FragmentWeb data={activeFragment} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="size-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">🖥️</div>
                <p className="text-sm font-medium">No preview yet</p>
                <p className="text-xs">Ask Vibel to build something and the preview will appear here</p>
              </div>
            )}
            </TabsContent>
            <TabsContent value="code" className="min-h-0 h-full">
            {!!activeFragment?.files ? (
                <FileExplorer files={activeFragment.files as {[path: string]: string}}/>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="size-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">📄</div>
                <p className="text-sm font-medium">No code yet</p>
                <p className="text-xs">Generated files will appear here</p>
              </div>
            )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
