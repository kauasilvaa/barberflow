"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./page.module.css";

import { Sidebar } from "../components/Sidebar";
import { API_URL } from "../services/api";

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
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  async function carregarDashboard() {
    try {
      const [dashboardRes, atendimentosRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`),
        fetch(`${API_URL}/atendimentos`),
      ]);

      const dashboardData = await dashboardRes.json();
      const atendimentosData = await atendimentosRes.json();

      setDashboard(dashboardData);
      setAtendimentos(atendimentosData);
    } catch (error) {
      console.error(error);
    }
  }

  const statusData = useMemo(() => {
    return [
      {
        name: "Pendentes",
        value: dashboard?.pendentes ?? 0,
        color: "#f59e0b",
      },
      {
        name: "Confirmados",
        value: dashboard?.confirmados ?? 0,
        color: "#22c55e",
      },
      {
        name: "Realizados",
        value: dashboard?.realizados ?? 0,
        color: "#d6a354",
      },
      {
        name: "Cancelados",
        value: dashboard?.cancelados ?? 0,
        color: "#ef4444",
      },
    ];
  }, [dashboard]);

  const faturamentoPorBarbeiro = useMemo(() => {
    const mapa = new Map<string, number>();

    atendimentos.forEach((atendimento) => {
      const barbeiro = atendimento.profissional.nome;
      const valorAtual = mapa.get(barbeiro) ?? 0;

      mapa.set(barbeiro, valorAtual + atendimento.valorTotal);
    });

    return Array.from(mapa.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [atendimentos]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />

          <div className={styles.heroContent}>
            <div>
              <span className={styles.badge}>BARBERFLOW PREMIUM</span>

              <h1>Gestão premium para barbearias modernas</h1>

              <p>
                Controle completo de clientes, barbeiros, agenda, serviços e
                faturamento em uma única plataforma.
              </p>
            </div>

            <div className={styles.heroStats}>
              <div>
                <span>Faturamento</span>

                <strong>
                  {(dashboard?.faturamentoRealizado ?? 0).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}
                </strong>
              </div>

              <div>
                <span>Agendamentos</span>

                <strong>{dashboard?.totalAtendimentos ?? 0}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cards}>
          <div className={styles.card}>
            <span>Clientes</span>
            <strong>{dashboard?.clientes ?? 0}</strong>
          </div>

          <div className={styles.card}>
            <span>Barbeiros</span>
            <strong>{dashboard?.profissionaisAtivos ?? 0}</strong>
          </div>

          <div className={styles.card}>
            <span>Serviços</span>
            <strong>{dashboard?.procedimentosAtivos ?? 0}</strong>
          </div>

          <div className={styles.card}>
            <span>Confirmados</span>
            <strong>{dashboard?.confirmados ?? 0}</strong>
          </div>
        </section>

        <section className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Status dos agendamentos</h2>
                <span>Distribuição operacional</span>
              </div>
            </div>

            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {statusData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgba(214,163,84,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.legend}>
              {statusData.map((item) => (
                <div key={item.name}>
                  <span style={{ background: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Faturamento por barbeiro</h2>
                <span>Receita acumulada por profissional</span>
              </div>
            </div>

            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={faturamentoPorBarbeiro}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />

                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} />

                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgba(214,163,84,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value) =>
                      Number(value).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                  />

                  <Bar dataKey="value" fill="#d6a354" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.largeCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Próximos agendamentos</h2>
                <span>{atendimentos.length} registros</span>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Barbeiro</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {atendimentos.slice(0, 6).map((atendimento) => (
                    <tr key={atendimento.id}>
                      <td>{atendimento.cliente.nome}</td>
                      <td>{atendimento.profissional.nome}</td>
                      <td>
                        {new Date(atendimento.data).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td>
                        {atendimento.valorTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.sideCard}>
            <h2>Performance</h2>

            <div className={styles.indicator}>
              <span>Pendentes</span>
              <strong>{dashboard?.pendentes ?? 0}</strong>
            </div>

            <div className={styles.indicator}>
              <span>Realizados</span>
              <strong>{dashboard?.realizados ?? 0}</strong>
            </div>

            <div className={styles.indicator}>
              <span>Cancelados</span>
              <strong>{dashboard?.cancelados ?? 0}</strong>
            </div>

            <div className={styles.indicator}>
              <span>Faturamento previsto</span>

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