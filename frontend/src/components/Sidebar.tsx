"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";

import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";

type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "USER";
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const usuarioString =
    typeof window !== "undefined"
      ? localStorage.getItem("barberflow_user")
      : null;

  const usuario: UsuarioLogado | null = usuarioString
    ? JSON.parse(usuarioString)
    : null;

  const isAdmin = usuario?.role === "ADMIN";

  function handleLogout() {
    localStorage.removeItem("barberflow_token");
    localStorage.removeItem("barberflow_user");
    router.replace("/login");
  }

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <div className={styles.mark}>
            <Scissors size={24} />
          </div>

          <div>
            <strong>BarberFlow</strong>
            <span>Studio Management</span>
          </div>
        </div>

        <div className={styles.studioCard}>
          <div>
            <span>Ambiente</span>
            <strong>Premium Barber</strong>
          </div>

          <Crown size={20} />
        </div>

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Operação</span>

          {isAdmin ? (
            <>
              <Link href="/" className={pathname === "/" ? styles.active : ""}>
                <LayoutDashboard size={18} />
                <span>Visão geral</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/agenda"
                className={pathname === "/agenda" ? styles.active : ""}
              >
                <CalendarCheck size={18} />
                <span>Agenda do dia</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/calendar"
                className={pathname === "/calendar" ? styles.active : ""}
              >
                <CalendarDays size={18} />
                <span>Calendário visual</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <span className={styles.navLabel}>Gestão</span>

              <Link
                href="/clientes"
                className={pathname === "/clientes" ? styles.active : ""}
              >
                <Users size={18} />
                <span>Clientes</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/profissionais"
                className={pathname === "/profissionais" ? styles.active : ""}
              >
                <Scissors size={18} />
                <span>Barbeiros</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/procedimentos"
                className={pathname === "/procedimentos" ? styles.active : ""}
              >
                <Sparkles size={18} />
                <span>Serviços</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/atendimentos"
                className={pathname === "/atendimentos" ? styles.active : ""}
              >
                <CalendarDays size={18} />
                <span>Atendimentos</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/agenda-operacional"
                className={
                  pathname === "/agenda-operacional" ? styles.active : ""
                }
              >
                <CalendarCheck size={18} />
                <span>Timeline premium</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/agendar"
                className={pathname === "/agendar" ? styles.active : ""}
              >
                <CalendarDays size={18} />
                <span>Agendar horário</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>

              <Link
                href="/meus-agendamentos"
                className={
                  pathname === "/meus-agendamentos" ? styles.active : ""
                }
              >
                <CalendarCheck size={18} />
                <span>Meus horários</span>
                <ChevronRight className={styles.chevron} size={16} />
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={styles.userBox}>
          <div className={styles.avatar}>
            {usuario?.nome?.charAt(0).toUpperCase() || "B"}
          </div>

          <div>
            <strong>{usuario?.nome || "Usuário"}</strong>
            <span>{usuario?.role === "ADMIN" ? "Administrador" : "Cliente"}</span>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={18} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}