"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldUser } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navPanel = [
  {
    title: "Panel",
    url: "#",
    items: [
      {
        title: "Administration",
        url: "/admin",
        icon: ShieldUser,
        subItems: [
          {
            title: "Item 1",
            url: "#",
          },
          {
            title: "Item 2",
            url: "#",
          },
        ],
      },
    ],
  },
]

export default function SidebarNavMenu() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Panel</SidebarGroupLabel>
        <SidebarMenu>
          {navPanel.map((group) =>
            group.items.map((item) => {
              const isGroupActive =
                pathname.startsWith(item.url) ||
                ('subItems' in item && item.subItems?.some((sub) => pathname.startsWith(sub.url)));
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={true}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isGroupActive}>
                        {item.icon && <item.icon />}
                        <Link href={item.url}>
                          <span>{item.title}</span>
                        </Link>
                        {'subItems' in item && item.subItems && (
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {'subItems' in item && item.subItems && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => {
                            const isActive = pathname.startsWith(subItem.url);
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isActive}>
                                  <a href={subItem.url} className="w-full">
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              );
            })
          )}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}