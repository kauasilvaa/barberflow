"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "./AuthGuard";
import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: React.ReactNode;
};

const publicRoutes = ["/login", "/register", "/forgot-password"];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.includes(pathname);

  return (
    <AuthGuard>
      {isPublicRoute ? (
        children
      ) : (
        <>
          <Sidebar />
          <main className="app-content">{children}</main>
        </>
      )}
    </AuthGuard>
  );
}