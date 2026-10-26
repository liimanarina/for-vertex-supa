import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Idea Board", description: "A little space for big ideas." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
