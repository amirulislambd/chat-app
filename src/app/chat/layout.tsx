import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chats | ChatApp",
  description: "Your ChatApp conversations, groups, and real-time messages.",
};

export default function ChatLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
