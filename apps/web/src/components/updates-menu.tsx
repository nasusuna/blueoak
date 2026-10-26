"use client";

import { useState } from "react";

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
        className="underline-offset-4 hover:underline"
        onClick={() => setOpen((current) => !current)}
      >
        Updates
      </button>
      {open ? (
        <section
          id="workspace-updates"
          aria-label="Updates"
          className="absolute right-0 top-full z-20 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
        >
          {notices.length === 0 ? (
            <p className="text-base">No updates right now.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-base">
              {notices.map((notice) => (
                <li key={notice.id} className={notice.tone === "warning" ? "text-destructive" : undefined}>
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
