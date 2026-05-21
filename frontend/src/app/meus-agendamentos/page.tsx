"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

type Atendimento = {
  id: string;
  data: string;
  status: string;
  valorTotal: number;

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

export default function MeusAgendamentosPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");

  async function carregarAgendamentos() {
    try {
      const response = await api("/auth/me/agendamentos");
      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Erro ao carregar agendamentos.");
        return;
      }

      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar seus agendamentos.");
    }
  }

  async function cancelarAgendamento(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente cancelar este agendamento?"
    );

    if (!confirmar) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const response = await api(`/atendimentos/${id}/cancelar`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível cancelar o agendamento.");
        return;
      }

      setMensagem("Agendamento cancelado com sucesso.");
      carregarAgendamentos();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao cancelar agendamento.");
    }
  }

  async function remarcarAgendamento(id: string) {
    if (!novaData) {
      setErro("Selecione uma nova data.");
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const response = await api(`/atendimentos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          data: novaData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível remarcar.");
        return;
      }

      setMensagem("Agendamento remarcado com sucesso.");
      setEditandoId(null);
      setNovaData("");
      carregarAgendamentos();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao remarcar.");
    }
  }

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <span>ÁREA DO CLIENTE</span>

        <h1>Meus agendamentos</h1>

        <p>
          Acompanhe seus horários, barbeiros, serviços e status dos
          atendimentos em tempo real.
        </p>
      </section>

      {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
      {erro && <div className={styles.errorMessage}>{erro}</div>}

      <section className={styles.cards}>
        <div className={styles.card}>
          <span>Total de horários</span>
          <strong>{atendimentos.length}</strong>
        </div>

        <div className={styles.card}>
          <span>Confirmados</span>
          <strong>
            {
              atendimentos.filter((item) => item.status === "CONFIRMADO")
                .length
            }
          </strong>
        </div>

        <div className={styles.card}>
          <span>Realizados</span>
          <strong>
            {
              atendimentos.filter((item) => item.status === "REALIZADO")
                .length
            }
          </strong>
        </div>

        <div className={styles.card}>
          <span>Cancelados</span>
          <strong>
            {
              atendimentos.filter((item) => item.status === "CANCELADO")
                .length
            }
          </strong>
        </div>
      </section>

      <section className={styles.timeline}>
        {atendimentos.map((atendimento) => {
          const duracaoTotal = atendimento.procedimentos.reduce(
            (total, item) => total + Number(item.procedimento.duracao ?? 0),
            0
          );

          return (
            <article key={atendimento.id} className={styles.timelineCard}>
              <div className={styles.top}>
                <div>
                  <h2>
                    {new Date(atendimento.data).toLocaleDateString("pt-BR")}
                  </h2>

                  <span>
                    {new Date(atendimento.data).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                  <span>Barbeiro</span>
                  <strong>{atendimento.profissional.nome}</strong>
                </div>

                <div>
                  <span>Especialidade</span>
                  <strong>{atendimento.profissional.especialidade}</strong>
                </div>

                <div>
                  <span>Duração</span>
                  <strong>{duracaoTotal} min</strong>
                </div>

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
              </div>

              <div className={styles.tags}>
                {atendimento.procedimentos.map((item, index) => (
                  <span key={index}>{item.procedimento.nome}</span>
                ))}
              </div>

              {atendimento.status !== "CANCELADO" &&
                atendimento.status !== "REALIZADO" && (
                  <>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.remarcarButton}
                        onClick={() => {
                          setEditandoId(atendimento.id);
                          setNovaData("");
                          setMensagem("");
                          setErro("");
                        }}
                      >
                        Remarcar
                      </button>

                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => cancelarAgendamento(atendimento.id)}
                      >
                        Cancelar agendamento
                      </button>
                    </div>

                    {editandoId === atendimento.id && (
                      <div className={styles.remarcarBox}>
                        <input
                          type="datetime-local"
                          value={novaData}
                          onChange={(e) => setNovaData(e.target.value)}
                        />

                        <button
                          type="button"
                          className={styles.salvarButton}
                          onClick={() => remarcarAgendamento(atendimento.id)}
                        >
                          Salvar nova data
                        </button>
                      </div>
                    )}
                  </>
                )}
            </article>
          );
        })}

        {atendimentos.length === 0 && (
          <div className={styles.empty}>
            <h3>Nenhum agendamento encontrado</h3>

            <p>Você ainda não possui horários cadastrados.</p>
          </div>
        )}
      </section>
    </main>
  );
}