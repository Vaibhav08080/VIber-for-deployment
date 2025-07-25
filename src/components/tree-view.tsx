import { TreeItem } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
interface TreeViewProps {
  data: TreeItem[];
  value?: string | null;
  onSelect?: (value: string) => void;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    Selectedvalue={value}
                    onSelect={onSelect}
                    parentpath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail/>
      </Sidebar>
    </SidebarProvider>
  );
};
interface TreeProps {
  item: TreeItem;
  Selectedvalue?: string | null;
  onSelect?: (value: string) => void;
  parentpath: string;
}
const Tree = ({ item, Selectedvalue, onSelect, parentpath }: TreeProps) => {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  const CurrentPath = parentpath ? `${parentpath}/${name}` : name;

  if (!items.length) {
    const isSelected = Selectedvalue === CurrentPath;

    return (
      <SidebarMenuButton
        isActive={isSelected}
        className="data-[active=true]:bg-transparent"
        onClick={() => onSelect?.(CurrentPath)}
      >
        <FileIcon />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    );
  }
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
            <SidebarMenuButton>
                <ChevronRightIcon className="transition-transform"/>
                <FolderIcon/>
                <span className="truncate">{name}</span>
            </SidebarMenuButton>
            
            
        </CollapsibleTrigger>
        <CollapsibleContent>
           <SidebarMenuSub>
            {items.map((subItem, index) => (
  <Tree
    key={index}
    item={subItem}
    Selectedvalue={Selectedvalue}
    onSelect={onSelect}
    parentpath={CurrentPath}
  />
))}
            
           </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
