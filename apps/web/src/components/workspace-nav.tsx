"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Home" },
  { href: "/app/customers", label: "Customers" },
  { href: "/app/equipment", label: "Equipment" },
  { href: "/app/chemicals", label: "Chemicals" },
  { href: "/app/units", label: "Installed units" },
  { href: "/app/visits", label: "Visits" },
];

const itemClass = "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition-colors";

export const WorkspaceNav = ({ updates }: { updates?: ReactNode }) => {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="flex items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(itemClass, active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
          >
            {link.label}
          </Link>
        );
      })}
      {updates}
    </nav>
  );
};
