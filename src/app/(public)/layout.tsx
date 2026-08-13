import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/">
            <Logo className="h-8 w-auto" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
