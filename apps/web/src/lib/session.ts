import { redirect } from "next/navigation";
import type { UserRole } from "@service-app/db";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
  customer_id: string | null;
};

export const loadWorkspace = async () => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, tenant_id, customer_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  return { supabase, userId: authData.user.id, profile, error };
};

export const isStaff = (role: UserRole) => role === "owner" || role === "technician";

export const redirectUnlessStaff = (role: UserRole) => {
  if (role === "customer") {
    redirect("/app");
  }
};
