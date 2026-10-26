import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Service App",
    template: "%s · Service App",
  },
  description: "Service workspace for installed equipment and preventive maintenance.",
};

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="en">
    <body className={`${geist.className} antialiased`}>{children}</body>
  </html>
);

export default RootLayout;
