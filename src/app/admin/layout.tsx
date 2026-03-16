"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Users, DoorOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8 text-center">Checking credentials...</div>;

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/admin" },
    { name: "Rooms & QR", icon: DoorOpen, href: "/admin/rooms" },
    { name: "Manage Users", icon: Users, href: "/admin/users" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-headline font-bold text-primary">NEU Room Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                pathname === item.href ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b bg-card px-4">
          <h1 className="text-lg font-headline font-bold text-primary">Admin</h1>
          <div className="flex items-center gap-2">
            <Link href="/admin"><LayoutDashboard className="h-6 w-6" /></Link>
            <Link href="/admin/rooms"><DoorOpen className="h-6 w-6" /></Link>
            <Link href="/admin/users"><Users className="h-6 w-6" /></Link>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-5 w-5" /></Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
