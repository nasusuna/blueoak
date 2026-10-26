import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/lib/workspace";

const AppLayout = async ({ children }: { children: ReactNode }) => <WorkspaceFrame>{children}</WorkspaceFrame>;

export default AppLayout;
