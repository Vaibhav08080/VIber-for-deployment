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
import { FragmentWeb } from "../components/fragment-web.";
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
          <Suspense fallback={<p>Loading Project...</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<p>Loading...</p>}>
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
            className="h-full gasp-y-0"
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
            <TabsContent value="preview">
            {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
            {!!activeFragment?.files && (
                <FileExplorer files={activeFragment.files as {[path: string]: string}}/>
            )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
