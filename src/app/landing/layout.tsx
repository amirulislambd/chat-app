import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChatApp | Real-time messaging",
  description: "Fast, simple, and secure real-time messaging for everyone.",
};

export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
