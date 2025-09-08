// src/components/layout/app-shell.tsx
"use client";

import React, { useState } from 'react';
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Flame, PanelLeft } from "lucide-react";
import { TeacherSidebarNav } from "./teacher-sidebar-nav";
import { useAppName, useAppLogo } from '@/contexts/config-context';
import { cn } from '@/lib/utils';
import { NotificationsBell } from '@/components/notifications/notifications-panel';

function MobileHeader({ userRole, userId }: { userRole: any; userId: string }) {
    const appName = useAppName();
    const appLogo = useAppLogo();
    
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="sm" variant="outline">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    </SheetHeader>
                    {userRole === 'Docente' ? (
                        <TeacherSidebarNav userId={userId} isCollapsed={false} onToggleCollapse={() => {}} />
                    ) : (
                        <SidebarNav userId={userId} isCollapsed={false} onToggleCollapse={() => {}} />
                    )}
                </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
                {appLogo ? (
                    <img src={appLogo} alt={appName} className="w-6 h-6" />
                ) : (
                  <Flame className="w-6 h-6 text-primary" />
                )}
                <h1 className="font-bold text-lg">{appName}</h1>
            </div>
            <div className="ml-auto">
                <NotificationsBell />
            </div>
        </header>
    )
}



export function AppShell({
  children,
  userRole,
  userId
}: {
  children: React.ReactNode;
  userRole: any;
  userId: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-56';
  const contentMargin = isCollapsed ? 'md:pl-16' : 'md:pl-56';
  
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40 overflow-hidden">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background md:flex transition-all duration-200",
        sidebarWidth
      )}>
         {userRole === 'Docente' ? (
           <TeacherSidebarNav 
             userId={userId} 
             isCollapsed={isCollapsed}
             onToggleCollapse={handleToggleCollapse}
           />
         ) : (
           <SidebarNav 
             userId={userId} 
             isCollapsed={isCollapsed}
             onToggleCollapse={handleToggleCollapse}
           />
         )}
      </aside>
      <div className={cn("flex flex-col h-full transition-all duration-200", contentMargin)}>
        <MobileHeader userRole={userRole} userId={userId} />
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="h-full">
              {children}
            </div>
        </main>
      </div>
    </div>
  );
}
