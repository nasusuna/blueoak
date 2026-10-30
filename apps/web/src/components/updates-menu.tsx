"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Notice = {
  id: string;
  text: string;
  tone: "default" | "warning";
};

export const UpdatesMenu = ({ notices }: { notices: Notice[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="workspace-updates"
        className={cn(
          "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition-colors",
          open ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        Updates
        {notices.some((notice) => notice.tone === "warning") ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
            {notices.filter((notice) => notice.tone === "warning").length}
          </span>
        ) : null}
      </button>
      {open ? (
        <section
          id="workspace-updates"
          aria-label="Updates"
          className="absolute top-full right-0 z-20 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-lg"
        >
          {notices.length === 0 ? (
            <p className="px-2 py-1 text-base text-muted-foreground">No updates right now.</p>
          ) : (
            <ul className="flex flex-col">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className={cn(
                    "rounded-lg px-3 py-2 text-base",
                    notice.tone === "warning" ? "bg-destructive/10 text-destructive" : "text-foreground",
                  )}
                >
                  {notice.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};
