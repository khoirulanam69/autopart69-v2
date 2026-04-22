import { 
  BarChart3, 
  Package, 
  CreditCard, 
  Wallet,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

import { canAccessRoute } from '@/lib/rbac';

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Produk", url: "/products", icon: Package },
  { title: "Transaksi", url: "/transactions", icon: CreditCard },
  { title: "Keuangan", url: "/finance", icon: Wallet },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { state, open, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const visibleItems = navigationItems.filter((item) => canAccessRoute(user?.role, item.url));

  return (
    <Sidebar 
      collapsible={isMobile ? "none" : "icon"}
      className={isMobile ? "w-16 shrink-0" : ""}
    >

      <SidebarHeader className="border-b border-border">
        {!isMobile && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Autopart69</span>
              <span className="truncate text-xs text-muted-foreground">
                Toko Sparepart
              </span>
            </div>
          </div>
        )}
        {isMobile && (
          <div className="flex items-center justify-center py-3">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isMobile && <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={isMobile ? item.title : undefined}>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        `${isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "hover:bg-accent hover:text-accent-foreground"} ${isMobile ? "flex items-center justify-center" : ""}`
                      }
                    >
                      <item.icon className="size-5" />
                      {!isMobile && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border mt-auto">
        <SidebarMenu>
          {!isMobile && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-2 text-sm">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <span className="text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.email}</span>
                </div>
              </div>
            </SidebarMenuItem>
          )}
          {isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton className="w-full justify-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <span className="text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={signOut} 
              className={`w-full ${isMobile ? "flex items-center justify-center" : ""}`}
              tooltip={isMobile ? "Logout" : undefined}
            >
              <LogOut className="size-5" />
              {!isMobile && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
