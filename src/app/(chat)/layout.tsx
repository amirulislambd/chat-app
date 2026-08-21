import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat dashboard | ChatApp",
  description: "Manage conversations and exchange real-time messages in ChatApp.",
};

export default function ChatGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
