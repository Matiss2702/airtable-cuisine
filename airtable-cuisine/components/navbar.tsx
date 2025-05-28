"use client"

import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="w-full top-0 sticky backdrop-blur-md bg-white/80 dark:bg-black/80 border-b z-50">
      <div className="w-full mx-auto max-w-7xl flex items-center justify-between py-2 px-4">
        <ul>
          <li>
            <Button asChild variant="ghost">
              <Link href="/">Accueil</Link>
            </Button>
          </li>
        </ul>
        <ul className="flex items-center space-x-4">
          <li>
            <Button asChild variant="link">
              <Link href="/recipes" className="text-sm">Recettes</Link>
            </Button>
          </li>
        </ul>
        <ul className="flex items-center space-x-4">
          <li>
            <Button asChild>
              <Link href="/recipes/submit" className="flex items-center gap-2 text-sm">
                <Plus />
                Submit Recipe
              </Link>
            </Button>
          </li>
          <li>
            <ModeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}