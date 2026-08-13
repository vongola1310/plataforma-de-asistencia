import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/eventos", label: "Eventos" },
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
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-5">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo className="h-6 w-auto" />
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                Admin
              </span>
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground"
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
      <main className="mx-auto max-w-6xl px-4 py-6 overflow-x-auto">{children}</main>
    </div>
  );
}
