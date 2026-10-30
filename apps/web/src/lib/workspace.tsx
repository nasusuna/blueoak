import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceNotices } from "@/components/workspace-notices";
import { isStaff, loadWorkspace } from "@/lib/session";

export const WorkspaceFrame = async ({ children }: { children: ReactNode }) => {
  const { supabase, profile, error } = await loadWorkspace();

  if (error || !profile) {
    return (
      <WorkspaceShell role={null} updates={null} businessName={null}>
        <h1 className="text-2xl font-semibold">{error ? "Could not load your profile" : "Account not ready"}</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {error
            ? "Sign out and try again."
            : "This login is not linked to a profile yet. Ask the business owner to finish the account."}
        </p>
      </WorkspaceShell>
    );
  }

  const { data: tenant } = await supabase.from("tenants").select("name").eq("id", profile.tenant_id).maybeSingle();

  return (
    <WorkspaceShell role={profile.role} businessName={tenant?.name ?? null} updates={isStaff(profile.role) ? <WorkspaceNotices /> : null}>
      {children}
    </WorkspaceShell>
  );
};
