import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const TextLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <Link href={href} className={cn("font-bold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link", className)}>
    {children}
  </Link>
);
