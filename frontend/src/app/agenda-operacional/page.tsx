"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

import { api } from "../../services/api";

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
      duracao: number;
    };
  }[];
};

export default function AgendaOperacionalPage() {
  const hoje = new Date().toISOString().slice(0, 10);

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  async function carregarAgenda() {
    try {
      const response = await api("/atendimentos");

      const data = await response.json();

      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarAgenda();
  }, []);

  const timeline = useMemo(() => {
    const horarios: string[] = [];

    for (let hora = 9; hora <= 18; hora++) {
      horarios.push(`${String(hora).padStart(2, "0")}:00`);

      if (hora !== 18) {
        horarios.push(`${String(hora).padStart(2, "0")}:30`);
      }
    }

    return horarios.map((horario) => {
      const atendimento = atendimentos.find((item) => {
        const data = new Date(item.data);

        const horarioItem = data.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const mesmaData =
          data.toISOString().slice(0, 10) === dataSelecionada;

        return mesmaData && horarioItem === horario;
      });

      return {
        horario,
        atendimento,
      };
    });
  }, [atendimentos, dataSelecionada]);

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <span>AGENDA TIMELINE</span>

        <h1>Agenda operacional</h1>

        <p>
          Visualização operacional em tempo real da agenda da barbearia.
        </p>
      </section>

      <section className={styles.filters}>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(event) => setDataSelecionada(event.target.value)}
        />
      </section>

      <section className={styles.timeline}>
        {timeline.map(({ horario, atendimento }) => (
          <div key={horario} className={styles.timelineRow}>
            <div className={styles.hour}>
              <strong>{horario}</strong>
            </div>

            {!atendimento && (
              <div className={styles.emptyCard}>
                <span>Horário disponível</span>
              </div>
            )}

            {atendimento && (
              <div className={styles.card}>
                <div className={styles.top}>
                  <div>
                    <h2>{atendimento.cliente.nome}</h2>

                    <span>
                      {atendimento.profissional.nome} •{" "}
                      {atendimento.profissional.especialidade}
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

                <div className={styles.bottom}>
                  <strong>
                    {Number(atendimento.valorTotal).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>

                  <div className={styles.tags}>
                    {atendimento.procedimentos.map((item, index) => (
                      <span key={index}>
                        {item.procedimento.nome}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}