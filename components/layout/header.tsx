"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Newspaper,
  Briefcase,
  TrendingUp,
  Bell,
  LogOut,
  Settings,
  UserIcon,
  CogIcon,
  Vault
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSettingsDialog } from "@/app/(dashboard)/(main)/user/user-setting-dialog";
import { LogoutDialog } from "@/app/(dashboard)/(main)/user/logout-confirm-dialog";

const navItems = [
  { name: "Screener", href: "/", icon: PieChart },
  { name: "Market News", href: "/market-news", icon: Newspaper },
  { name: "Global News", href: "/rss-feeds", icon: TrendingUp },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();

  const user = session?.user;
  const isAdmin = (user as any)?.role === "ADMIN";

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 justify-between shrink-0">
      {/* Left side: Logo and Nav */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center transition-transform group-hover:scale-105">
            <Vault className="text-primary-foreground w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            INVEST<span className="text-primary">SMARTER</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right side: Notifications and Profile */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-background" />
        </button>

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end font-sans">
            <span className="text-xs font-bold leading-none text-foreground">
              {user?.name || ""}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 opacity-70">
              {user?.email || "Smart_Investor"}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-8 w-8 border border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                <AvatarImage key={user?.image} src={user?.image || ""} />
                <AvatarFallback className="bg-gradient-to-tr from-primary to-accent text-white text-[10px] font-bold">
                  {user?.name?.charAt(0) || <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 font-sans">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer font-sans text-sm py-2.5">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer font-sans text-sm py-2.5">
                    <CogIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuGroup>
              )}
              <DropdownMenuItem
                onClick={() => setLogoutOpen(true)}
                className="text-destructive focus:text-destructive cursor-pointer font-sans"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          setLogoutOpen(false);
          signOut({ callbackUrl: "/login" });
        }}
      />
    </header>
  );
}
