import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | ChatApp",
  description: "Sign in to ChatApp to start real-time conversations.",
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
