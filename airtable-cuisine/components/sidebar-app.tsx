import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import SidebarUser from "@/components/sidebar-user"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import SidebarNavMenu from "./sidebar-menu"
import { House } from "lucide-react"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="h-16">
        <SidebarMenu className="h-full">
          <SidebarMenuItem className="w-full h-full flex items-center justify-center">
            <Link href="/" className="w-full flex items-between gap-4">
              <House className="w-6" />
              <span>Home</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarNavMenu />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
