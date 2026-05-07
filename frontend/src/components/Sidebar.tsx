"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Sidebar.module.css";

import {
  LayoutDashboard,
  Users,
  Scissors,
  Sparkles,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logo}>
          BarberFlow
        </div>

        <div className={styles.subtitle}>
          Premium Barbershop
        </div>

        <nav className={styles.nav}>
          <Link
            href="/"
            className={
              pathname === "/"
                ? styles.active
                : ""
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/clientes"
            className={
              pathname === "/clientes"
                ? styles.active
                : ""
            }
          >
            <Users size={18} />
            Clientes
          </Link>

          <Link
            href="/profissionais"
            className={
              pathname === "/profissionais"
                ? styles.active
                : ""
            }
          >
            <Scissors size={18} />
            Barbeiros
          </Link>

          <Link
            href="/procedimentos"
            className={
              pathname === "/procedimentos"
                ? styles.active
                : ""
            }
          >
            <Sparkles size={18} />
            Serviços
          </Link>

          <Link
            href="/atendimentos"
            className={
              pathname === "/atendimentos"
                ? styles.active
                : ""
            }
          >
            <CalendarDays size={18} />
            Agendamentos
          </Link>

          <Link
            href="/agenda"
            className={
              pathname === "/agenda"
                ? styles.active
                : ""
            }
          >
            <CalendarCheck size={18} />
            Agenda
          </Link>
        </nav>
      </div>

      <div className={styles.footer}>
        <div className={styles.avatar}>
          B
        </div>

        <div>
          <strong>Administrador</strong>
          <span>BarberFlow</span>
        </div>
      </div>
    </aside>
  );
}