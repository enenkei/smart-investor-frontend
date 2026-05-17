"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Newspaper,
  Briefcase,
  TrendingUp,
  Vault,
  SettingsIcon,
  BellIcon,
  LogOut,
  ChevronDownIcon,
  CogIcon
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
import { UserIcon, Settings } from "lucide-react";
import { useState } from "react";
import { UserSettingsDialog } from "@/app/(dashboard)/(main)/user/user-setting-dialog";
import { LogoutDialog } from "@/app/(dashboard)/(main)/user/logout-confirm-dialog";


const navItems = [
  { name: "Screener", href: "/", icon: PieChart },
  { name: "Market News", href: "/market-news", icon: Newspaper },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Global News", href: "/rss-feeds", icon: TrendingUp },
  { name: "Notifications", href: "/notifications", icon: BellIcon },
  // { name: "Admin", href: "/admin", icon: SettingsIcon, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const router = useRouter();

  const user = session?.user;
  const isAdmin = (user as any)?.role === "ADMIN";

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <Vault className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-sidebar-foreground">
          INVEST<span className="text-primary">SMARTER</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          // if (item.adminOnly && !isAdmin) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/50")}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 pl-6 border-l-4 border-r-4 border-primary mb-2">
        <div className="flex flex-col items-end mr-1 font-sans">
          <span className="text-sm font-bold leading-none text-foreground">
            {user?.name || ""}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
            {user?.email || "Smart_Investor"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="border-2 border-background shadow-lg group-hover:border-primary/20 transition-all">
              <AvatarImage key={user?.image} src={user?.image || ""} />
              <AvatarFallback className="bg-gradient-to-tr from-primary to-accent text-white">
                <UserIcon className="h-5 w-5" />
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
            {isAdmin && <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer font-sans text-sm py-2.5">
                <CogIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Admin</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>}
            <DropdownMenuSeparator />
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
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          setLogoutOpen(false);
          signOut({ callbackUrl: "/login" });
        }}
      />
    </aside>
  );
}

