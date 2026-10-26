import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export const recordActivity = async (
  supabase: Client,
  input: { tenantId: string; userId: string; kind: string; summary: string },
) => {
  await supabase.from("activity").insert({
    tenant_id: input.tenantId,
    kind: input.kind,
    summary: input.summary,
    created_by: input.userId,
  });
};
