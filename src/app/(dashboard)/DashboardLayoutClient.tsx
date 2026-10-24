"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SidebarToggleContext } from "@/components/layout/SidebarToggleContext";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <SidebarToggleContext.Provider value={() => setSidebarOpen(true)}>
        <div className="flex min-h-screen bg-gray-100">
          {/* Backdrop para móvil */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar
            open={sidebarOpen}
            onNavigate={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col lg:ml-80">
            <main className="flex-1">{children}</main>
          </div>

          <ChatWidget />
        </div>
      </SidebarToggleContext.Provider>
    </ToastProvider>
  );
}
