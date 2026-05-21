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
    };
  }[];
};

export default function AgendaPage() {
  const hoje = new Date().toISOString().slice(0, 10);

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [statusSelecionado, setStatusSelecionado] = useState("TODOS");
  const [erro, setErro] = useState("");

  async function carregarAgenda() {
    try {
      setErro("");

      const response = await api("/atendimentos");
      const data = await response.json();

      if (Array.isArray(data)) {
        setAtendimentos(data);
      } else {
        setAtendimentos([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar a agenda.");
    }
  }

  function pegarDataLocal(dataISO: string) {
    return new Date(dataISO).toISOString().slice(0, 10);
  }

  const atendimentosFiltrados = useMemo(() => {
    return atendimentos
      .filter((atendimento) => {
        const mesmaData = pegarDataLocal(atendimento.data) === dataSelecionada;

        const mesmoStatus =
          statusSelecionado === "TODOS" ||
          atendimento.status === statusSelecionado;

        return mesmaData && mesmoStatus;
      })
      .sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );
  }, [atendimentos, dataSelecionada, statusSelecionado]);

  const resumoDoDia = useMemo(() => {
    const atendimentosDoDia = atendimentos.filter(
      (atendimento) => pegarDataLocal(atendimento.data) === dataSelecionada
    );

    return {
      total: atendimentosDoDia.length,
      confirmados: atendimentosDoDia.filter(
        (item) => item.status === "CONFIRMADO"
      ).length,
      realizados: atendimentosDoDia.filter(
        (item) => item.status === "REALIZADO"
      ).length,
      cancelados: atendimentosDoDia.filter(
        (item) => item.status === "CANCELADO"
      ).length,
      faturamento: atendimentosDoDia
        .filter((item) => item.status !== "CANCELADO")
        .reduce((total, item) => total + Number(item.valorTotal ?? 0), 0),
    };
  }, [atendimentos, dataSelecionada]);

  useEffect(() => {
    carregarAgenda();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <span>AGENDA OPERACIONAL</span>

          <h1>Agenda da barbearia</h1>

          <p>
            Visualize horários, barbeiros, clientes, serviços e status dos
            atendimentos em uma visão diária profissional.
          </p>
        </section>

        <section className={styles.filtersCard}>
          <div>
            <h2>Controle da agenda</h2>
            <p>Filtre por data e status para acompanhar a operação do dia.</p>
          </div>

          <div className={styles.filters}>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(event) => setDataSelecionada(event.target.value)}
            />

            <select
              value={statusSelecionado}
              onChange={(event) => setStatusSelecionado(event.target.value)}
            >
              <option value="TODOS">Todos os status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="CONFIRMADO">Confirmados</option>
              <option value="REALIZADO">Realizados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </section>

        {erro && <div className={styles.errorMessage}>{erro}</div>}

        <section className={styles.summary}>
          <div className={styles.summaryCard}>
            <span>Total do dia</span>
            <strong>{resumoDoDia.total}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Confirmados</span>
            <strong>{resumoDoDia.confirmados}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Realizados</span>
            <strong>{resumoDoDia.realizados}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Cancelados</span>
            <strong>{resumoDoDia.cancelados}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Faturamento do dia</span>
            <strong>
              {resumoDoDia.faturamento.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
        </section>

        <section className={styles.timelineHeader}>
          <div>
            <h2>Timeline do dia</h2>
            <p>
              {new Date(`${dataSelecionada}T00:00:00`).toLocaleDateString(
                "pt-BR",
                {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
          </div>

          <span>{atendimentosFiltrados.length} horários</span>
        </section>

        <section className={styles.timeline}>
          {atendimentosFiltrados.length === 0 && (
            <div className={styles.emptyState}>
              <strong>Nenhum horário encontrado</strong>
              <p>
                Não existem agendamentos para os filtros selecionados nesta data.
              </p>
            </div>
          )}

          {atendimentosFiltrados.map((atendimento) => (
            <div key={atendimento.id} className={styles.card}>
              <div className={styles.timeColumn}>
                <strong>
                  {new Date(atendimento.data).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>

                <span>
                  {new Date(atendimento.data).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{atendimento.cliente?.nome ?? "Cliente não informado"}</h2>

                    <span>
                      {atendimento.profissional?.nome ?? "Barbeiro não informado"}{" "}
                      • {atendimento.profissional?.especialidade ?? "Especialidade"}
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
                    <span>Valor</span>

                    <strong>
                      {Number(atendimento.valorTotal ?? 0).toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        }
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Serviços</span>

                    <strong>
                      {atendimento.procedimentos?.length ?? 0} selecionado(s)
                    </strong>
                  </div>
                </div>

                <div className={styles.procedimentos}>
                  {atendimento.procedimentos?.map((item, index) => (
                    <span key={index}>{item.procedimento.nome}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}