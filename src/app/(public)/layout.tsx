import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="brand-rule h-1 w-full" />
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo className="h-9 w-auto" />
          </Link>
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
            Capacitaciones
          </span>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t py-8">
        <p className="text-center text-sm text-muted-foreground">
          Euroimmun · From Revvity
        </p>
      </footer>
    </div>
  );
}
