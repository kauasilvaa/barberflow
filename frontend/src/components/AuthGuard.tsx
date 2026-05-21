"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
};

type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "USER";
};

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const adminRoutes = [
  "/",
  "/clientes",
  "/profissionais",
  "/procedimentos",
  "/atendimentos",
  "/agenda",
  "/agenda-operacional",
  "/calendar",
  "/change-password",
];

const userRoutes = [
  "/agendar",
  "/meus-agendamentos",
  "/change-password",
];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("barberflow_token");
    const usuarioString = localStorage.getItem("barberflow_user");

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (token && isPublicRoute) {
      const usuario: UsuarioLogado | null = usuarioString
        ? JSON.parse(usuarioString)
        : null;

      router.replace(usuario?.role === "ADMIN" ? "/" : "/agendar");
      return;
    }

    if (token && usuarioString) {
      const usuario: UsuarioLogado = JSON.parse(usuarioString);

      if (usuario.role === "USER" && adminRoutes.includes(pathname)) {
        router.replace("/agendar");
        return;
      }

      if (usuario.role === "ADMIN" && userRoutes.includes(pathname)) {
        router.replace("/");
        return;
      }
    }

    setCheckingAuth(false);
  }, [pathname, router]);

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#090909",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        Carregando BarberFlow...
      </div>
    );
  }

  return <>{children}</>;
}