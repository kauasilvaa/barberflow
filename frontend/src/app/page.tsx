"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Scissors,
  TrendingUp,
  Users,
} from "lucide-react";

import styles from "./page.module.css";
import { api } from "../services/api";

type DashboardData = {
  totalAtendimentos: number;
  confirmados: number;
  pendentes: number;
  realizados: number;
  cancelados: number;
  clientes: number;
  profissionaisAtivos: number;
  procedimentosAtivos: number;
  faturamentoPrevisto: number;
  faturamentoRealizado: number;
};

type Atendimento = {
  id: string;
  data: string;
  status: string;
  valorTotal: number;
  cliente: {
    nome: string;
  };
  profissional: {
    nome: string;
  };
  procedimentos?: {
    procedimento: {
      nome: string;
      duracao?: number;
    };
  }[];
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  async function carregarDados() {
    try {
      const [dashboardRes, atendimentosRes] = await Promise.all([
        api("/dashboard"),
        api("/atendimentos"),
      ]);

      const dashboardData = await dashboardRes.json();
      const atendimentosData = await atendimentosRes.json();

      if (dashboardRes.ok) {
        setDashboard(dashboardData);
      }

      setAtendimentos(Array.isArray(atendimentosData) ? atendimentosData : []);
    } catch (error) {
      console.error(error);
      setAtendimentos([]);
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const atendimentosHoje = useMemo(() => {
    return atendimentos
      .filter((atendimento) => {
        return new Date(atendimento.data).toISOString().slice(0, 10) === hoje;
      })
      .sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );
  }, [atendimentos, hoje]);

  const proximoAtendimento = useMemo(() => {
    const agora = new Date();

    return atendimentosHoje.find((atendimento) => {
      return (
        new Date(atendimento.data) >= agora &&
        atendimento.status !== "CANCELADO" &&
        atendimento.status !== "REALIZADO"
      );
    });
  }, [atendimentosHoje]);

  const faturamentoHoje = useMemo(() => {
    return atendimentosHoje
      .filter((item) => item.status !== "CANCELADO")
      .reduce((total, item) => total + Number(item.valorTotal ?? 0), 0);
  }, [atendimentosHoje]);

  const taxaOcupacao = useMemo(() => {
    if (atendimentosHoje.length === 0) {
      return 0;
    }

    const ocupados = atendimentosHoje.filter(
      (item) => item.status !== "CANCELADO"
    ).length;

    return Math.round((ocupados / atendimentosHoje.length) * 100);
  }, [atendimentosHoje]);

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <section className={styles.header}>
          <div>
            <span>PAINEL OPERACIONAL</span>

            <h1>Controle da barbearia</h1>

            <p>
              Acompanhe os horários do dia, próximos clientes, faturamento e
              movimentação da operação.
            </p>
          </div>

          <div className={styles.todayBox}>
            <Clock size={20} />
            <strong>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </strong>
          </div>
        </section>

        <section className={styles.operationGrid}>
          <div className={styles.nextClientCard}>
            <div className={styles.cardLabel}>
              <CalendarCheck size={18} />
              Próximo atendimento
            </div>

            {proximoAtendimento ? (
              <>
                <div className={styles.nextTime}>
                  {new Date(proximoAtendimento.data).toLocaleTimeString(
                    "pt-BR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>

                <h2>{proximoAtendimento.cliente?.nome}</h2>

                <p>
                  Barbeiro:{" "}
                  <strong>{proximoAtendimento.profissional?.nome}</strong>
                </p>

                <div className={styles.serviceList}>
                  {proximoAtendimento.procedimentos?.map((item, index) => (
                    <span key={index}>{item.procedimento.nome}</span>
                  ))}
                </div>

                <div className={styles.nextFooter}>
                  <strong>
                    {Number(proximoAtendimento.valorTotal ?? 0).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </strong>

                  <span
                    className={
                      proximoAtendimento.status === "CONFIRMADO"
                        ? styles.confirmado
                        : styles.pendente
                    }
                  >
                    {proximoAtendimento.status}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.noClient}>
                <h2>Nenhum próximo atendimento</h2>
                <p>A agenda ainda não possui próximo cliente para hoje.</p>
              </div>
            )}
          </div>

          <div className={styles.metricsColumn}>
            <div className={styles.metricCard}>
              <DollarSign size={22} />
              <span>Caixa do dia</span>
              <strong>
                {faturamentoHoje.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <div className={styles.metricCard}>
              <Scissors size={22} />
              <span>Atendimentos hoje</span>
              <strong>{atendimentosHoje.length}</strong>
            </div>

            <div className={styles.metricCard}>
              <TrendingUp size={22} />
              <span>Ocupação</span>
              <strong>{taxaOcupacao}%</strong>
            </div>
          </div>
        </section>

        <section className={styles.summaryBar}>
          <div>
            <Users size={20} />
            <span>Clientes</span>
            <strong>{dashboard?.clientes ?? 0}</strong>
          </div>

          <div>
            <Scissors size={20} />
            <span>Barbeiros ativos</span>
            <strong>{dashboard?.profissionaisAtivos ?? 0}</strong>
          </div>

          <div>
            <CalendarCheck size={20} />
            <span>Confirmados</span>
            <strong>{dashboard?.confirmados ?? 0}</strong>
          </div>

          <div>
            <DollarSign size={20} />
            <span>Faturamento total</span>
            <strong>
              {(dashboard?.faturamentoRealizado ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
        </section>

        <section className={styles.bottomGrid}>
          <div className={styles.timelineCard}>
            <div className={styles.sectionTitle}>
              <div>
                <h2>Agenda de hoje</h2>
                <p>Fluxo operacional dos atendimentos do dia.</p>
              </div>

              <span>{atendimentosHoje.length} horários</span>
            </div>

            <div className={styles.timeline}>
              {atendimentosHoje.length === 0 && (
                <div className={styles.emptyState}>
                  Nenhum atendimento marcado para hoje.
                </div>
              )}

              {atendimentosHoje.slice(0, 8).map((atendimento) => (
                <div key={atendimento.id} className={styles.timelineItem}>
                  <div className={styles.hour}>
                    {new Date(atendimento.data).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className={styles.timelineInfo}>
                    <strong>{atendimento.cliente?.nome}</strong>
                    <span>{atendimento.profissional?.nome}</span>
                  </div>

                  <span
                    className={
                      atendimento.status === "CONFIRMADO"
                        ? styles.confirmado
                        : atendimento.status === "CANCELADO"
                        ? styles.cancelado
                        : atendimento.status === "REALIZADO"
                        ? styles.realizado
                        : styles.pendente
                    }
                  >
                    {atendimento.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cashCard}>
            <h2>Resumo da operação</h2>

            <div className={styles.cashLine}>
              <span>Pendentes</span>
              <strong>{dashboard?.pendentes ?? 0}</strong>
            </div>

            <div className={styles.cashLine}>
              <span>Realizados</span>
              <strong>{dashboard?.realizados ?? 0}</strong>
            </div>

            <div className={styles.cashLine}>
              <span>Cancelados</span>
              <strong>{dashboard?.cancelados ?? 0}</strong>
            </div>

            <div className={styles.cashTotal}>
              <span>Previsto</span>
              <strong>
                {(dashboard?.faturamentoPrevisto ?? 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}