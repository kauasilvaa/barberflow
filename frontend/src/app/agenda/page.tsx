"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

import { Sidebar } from "../../components/Sidebar";
import { API_URL } from "../../services/api";

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
    especialidade: string;
  };

  procedimentos: {
    procedimento: {
      nome: string;
    };
  }[];
};

export default function AgendaPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  async function carregarAgenda() {
    try {
      const response = await fetch(`${API_URL}/atendimentos`);

      const data = await response.json();

      setAtendimentos(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarAgenda();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.content}>
        <section className={styles.hero}>
          <span>AGENDA OPERACIONAL</span>

          <h1>Agenda da barbearia</h1>

          <p>
            Visualize horários, barbeiros, clientes, serviços e status dos
            atendimentos em tempo real.
          </p>
        </section>

        <section className={styles.summary}>
          <div className={styles.summaryCard}>
            <span>Total do dia</span>

            <strong>{atendimentos.length}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Confirmados</span>

            <strong>
              {
                atendimentos.filter(
                  (item) => item.status === "CONFIRMADO"
                ).length
              }
            </strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Realizados</span>

            <strong>
              {
                atendimentos.filter(
                  (item) => item.status === "REALIZADO"
                ).length
              }
            </strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Cancelados</span>

            <strong>
              {
                atendimentos.filter(
                  (item) => item.status === "CANCELADO"
                ).length
              }
            </strong>
          </div>
        </section>

        <section className={styles.timeline}>
          {atendimentos.map((atendimento) => (
            <div key={atendimento.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>
                    {new Date(atendimento.data).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </h2>

                  <span>
                    {new Date(atendimento.data).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div
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
                </div>
              </div>

              <div className={styles.info}>
                <div>
                  <span>Cliente</span>

                  <strong>{atendimento.cliente.nome}</strong>
                </div>

                <div>
                  <span>Barbeiro</span>

                  <strong>{atendimento.profissional.nome}</strong>
                </div>

                <div>
                  <span>Especialidade</span>

                  <strong>{atendimento.profissional.especialidade}</strong>
                </div>

                <div>
                  <span>Valor</span>

                  <strong>
                    {atendimento.valorTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </div>
              </div>

              <div className={styles.procedimentos}>
                {atendimento.procedimentos.map((item, index) => (
                  <span key={index}>{item.procedimento.nome}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}