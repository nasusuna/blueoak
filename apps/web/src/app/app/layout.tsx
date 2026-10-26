import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const AppLayout = async ({ children }: { children: ReactNode }) => <WorkspaceFrame>{children}</WorkspaceFrame>;

export default AppLayout;
