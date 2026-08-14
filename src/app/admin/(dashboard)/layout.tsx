import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/registros", label: "Registros" },
  { href: "/admin/croquis", label: "Croquis" },
  { href: "/admin/emails", label: "Correos" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <div className="brand-rule h-1 w-full" />
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <span className="hidden rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary sm:inline">
                Admin
              </span>
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {session?.user?.email}
            </span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl overflow-x-auto px-5 py-8">
        {children}
      </main>
    </div>
  );
}
