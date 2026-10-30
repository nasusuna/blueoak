import type { UserRole } from "@service-app/db";
import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { WorkspaceNav } from "@/components/workspace-nav";

export const WorkspaceShell = ({
  role,
  updates,
  businessName,
  children,
}: {
  role: UserRole | null;
  updates?: ReactNode;
  businessName?: string | null;
  children: ReactNode;
}) => {
  const showStaffNav = role === "owner" || role === "technician";
  const showCustomerNav = role === "customer";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-3">
          <Link href="/app" className="flex items-center gap-2.5 pt-1">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">BO</span>
            <span className="text-base font-semibold tracking-tight">Blue Oak</span>
          </Link>
          <div className="flex flex-col items-end gap-2">
            {businessName ? <p className="text-right text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{businessName}</p> : null}
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        {showStaffNav ? (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <WorkspaceNav updates={updates} />
          </div>
        ) : null}
        {showCustomerNav ? (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <nav aria-label="Your lab" className="flex items-center gap-1">
              <Link href="/app" aria-current="page" className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground">
                My lab
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
};
