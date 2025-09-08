// src/components/layout/teacher-sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Box,
  ArrowRightLeft,
  CalendarDays,
  Flame,
  User,
  Settings,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SheetClose } from "../ui/sheet";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { ProfileDialog } from "../users/profile-dialog";
import { createClient } from "@/lib/supabase/client";
import { useAppName, useAppLogo } from '@/contexts/config-context';

interface TeacherSidebarNavProps {
  isMobile?: boolean;
  userId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Organización lógica del menú para docentes: Mi Espacio -> Recursos -> Operaciones
const navItems = [
    // Panel principal
    { href: "/dashboard", label: "Mi Espacio Académico", icon: LayoutDashboard },
    
    // Gestión de recursos
    { href: "/inventario", label: "Inventario", icon: Box },
    
    // Operaciones diarias
    { href: "/prestamos", label: "Mis Préstamos", icon: ArrowRightLeft },
    { href: "/reservas", label: "Reservas", icon: CalendarDays },
];

function NavLink({ href, label, icon: Icon, isActive, isMobile, onClick, disabled, isCollapsed }: { href: string, label: string, icon: React.ElementType, isActive: boolean, isMobile?: boolean, onClick?: () => void, disabled?: boolean, isCollapsed?: boolean }) {
  const LinkContent = () => (
    <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full gap-2 transition-all duration-200",
          isCollapsed ? "justify-center px-2" : "justify-start"
        )}
        onClick={onClick}
        disabled={disabled}
        title={isCollapsed ? label : undefined}
    >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="truncate">{label}</span>
            {disabled && <span className="text-xs text-muted-foreground">(Pronto)</span>}
          </>
        )}
    </Button>
  )
  
  if (disabled) {
    return <LinkContent />;
  }

  if (isMobile && !onClick) {
    return (
      <SheetClose asChild>
        <Link href={href}>
          <LinkContent />
        </Link>
      </SheetClose>
    )
  }
  
  if (onClick) {
      return <LinkContent />
  }

  return (
    <Link href={href}>
      <LinkContent />
    </Link>
  );
}

export function TeacherSidebarNav({ isMobile = false, userId, isCollapsed = false, onToggleCollapse }: TeacherSidebarNavProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [user, setUser] = useState<any>(null);
  const appName = useAppName();
  const appLogo = useAppLogo();

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const supabase = createClient();
        const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single();
        setUser(profile);
      }
    };
    fetchUser();
  }, [userId]);

  const mainNav = (
    <nav className={cn(
      "grid items-start gap-1 text-sm font-medium transition-all duration-200",
      isCollapsed ? "px-1" : "px-2"
    )}>
      {navItems.map((item) => (
        <NavLink 
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          isMobile={isMobile}
          disabled={(item as any).disabled}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );

  const bottomNav = (
     <nav className={cn(
       "grid items-start gap-1 text-sm font-medium transition-all duration-200",
       isCollapsed ? "px-1" : "px-2"
     )}>
        <NavLink 
          href="/configuracion"
          label="Ajustes"
          icon={Settings}
          isActive={pathname === '/configuracion' || pathname.startsWith('/configuracion/')}
          isMobile={isMobile}
          isCollapsed={isCollapsed}
        />
        <Button
            variant={"ghost"}
            className={cn(
              "w-full gap-2 transition-all duration-200",
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={() => setIsProfileOpen(true)}
            title={isCollapsed ? "Perfil" : undefined}
        >
            <User className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Perfil</span>}
        </Button>
     </nav>
  );

  const Header = () => (
     <div className={cn(
        "flex h-14 items-center border-b transition-all duration-200",
        isMobile && "px-6",
        isCollapsed ? "px-2 justify-center" : "px-4 lg:px-6"
     )}>
        <Link href="/" className={cn(
          "flex items-center font-semibold transition-all duration-200",
          isCollapsed ? "gap-0" : "gap-2"
        )}>
          {appLogo ? (
            <img src={appLogo} alt={appName} className="h-6 w-6 flex-shrink-0" />
          ) : (
            <Flame className="h-6 w-6 text-primary flex-shrink-0" />
          )}
          {!isCollapsed && <span className="truncate">{appName}</span>}
        </Link>
        {!isMobile && onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              "ml-auto h-8 w-8 p-0 transition-all duration-200",
              isCollapsed && "ml-0 mt-2"
            )}
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
  );

  return (
    <>
        <div className="flex h-full max-h-screen flex-col gap-2">
        <Header />
        <div className="flex-1 overflow-auto py-2">
            {mainNav}
        </div>
        <div className={cn(
          "mt-auto border-t transition-all duration-200",
          isCollapsed ? "p-2" : "p-4"
        )}>
            {bottomNav}
        </div>
        </div>
        <ProfileDialog isOpen={isProfileOpen} setIsOpen={setIsProfileOpen} user={user} />
    </>
  );
}
