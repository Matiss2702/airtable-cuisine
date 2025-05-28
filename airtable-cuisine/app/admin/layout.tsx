import { ModeToggle } from "@/components/mode-toggle";
import { AppSidebar } from "@/components/sidebar-app";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" />
          <div className="w-full flex items-center justify-end pl-2">
            <ModeToggle />
          </div>
        </header>
        <div className="h-full p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}