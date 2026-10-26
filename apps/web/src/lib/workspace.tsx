import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceNotices } from "@/components/workspace-notices";
import { isStaff, loadWorkspace } from "@/lib/session";

export const WorkspaceFrame = async ({ children }: { children: ReactNode }) => {
  const { profile, error } = await loadWorkspace();

  if (error || !profile) {
    return (
      <WorkspaceShell role={null} updates={null}>
        <h1 className="text-2xl font-semibold">{error ? "Could not load your profile" : "Account not ready"}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {error
            ? "Sign out and try again."
            : "This login is not linked to a staff profile. Ask a platform admin to finish the account."}
        </p>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell role={profile.role} updates={isStaff(profile.role) ? <WorkspaceNotices /> : null}>
      {children}
    </WorkspaceShell>
  );
};
