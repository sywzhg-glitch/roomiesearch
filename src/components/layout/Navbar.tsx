"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Users, Home, Store, User, LogOut, Menu, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">RoomieSearch</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <Button variant={pathname.startsWith(href) ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <Icon className="w-4 h-4" />{label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/groups/new">
              <Button size="sm" className="gap-2">
                <PlusCircle className="w-4 h-4" />New Group
              </Button>
            </Link>
            {session?.user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    {getInitials(session.user.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="gap-1">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 bg-white">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", pathname.startsWith(href) ? "bg-indigo-50 text-indigo-700" : "text-gray-600")}>
                <Icon className="w-4 h-4" />{label}
              </div>
            </Link>
          ))}
          <Link href="/groups/new" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600">
              <PlusCircle className="w-4 h-4" />New Group
            </div>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 w-full">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
