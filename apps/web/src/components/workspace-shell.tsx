import type { UserRole } from "@service-app/db";
import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/app", label: "Home" },
  { href: "/app/customers", label: "Customers" },
  { href: "/app/equipment", label: "Equipment" },
  { href: "/app/chemicals", label: "Chemicals" },
  { href: "/app/units", label: "Installed units" },
  { href: "/app/visits", label: "Visits" },
];

export const WorkspaceShell = ({
  role,
  updates,
  children,
}: {
  role: UserRole | null;
  updates?: ReactNode;
  children: ReactNode;
}) => {
  const showMasters = role === "owner" || role === "technician";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-base font-semibold">Service App</p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
        {showMasters ? (
          <nav aria-label="Workspace" className="mx-auto flex max-w-5xl flex-wrap gap-x-5 gap-y-2 px-4 pb-4 text-base">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
                {link.label}
              </Link>
            ))}
            {updates}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
};
