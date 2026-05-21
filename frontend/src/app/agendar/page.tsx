"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

type Profissional = {
  id: string;
  nome: string;
  especialidade: string;
  ativo: boolean;
};

type Procedimento = {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  duracao: number;
  ativo: boolean;
};

type Cliente = {
  id: string;
  nome: string;
  email: string;
};

export default function AgendarPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  const [profissionalId, setProfissionalId] = useState("");
  const [procedimentoIds, setProcedimentoIds] = useState<string[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const valorTotal = useMemo(() => {
    return procedimentos
      .filter((item) => procedimentoIds.includes(item.id))
      .reduce((total, item) => total + Number(item.preco), 0);
  }, [procedimentos, procedimentoIds]);

  const duracaoTotal = useMemo(() => {
    return procedimentos
      .filter((item) => procedimentoIds.includes(item.id))
      .reduce((total, item) => total + Number(item.duracao), 0);
  }, [procedimentos, procedimentoIds]);

  async function carregarDados() {
    try {
      const [clienteRes, profissionaisRes, procedimentosRes] =
        await Promise.all([
          api("/auth/me/cliente"),
          api("/public/profissionais"),
          api("/public/procedimentos"),
        ]);

      const clienteData = await clienteRes.json();
      const profissionaisData = await profissionaisRes.json();
      const procedimentosData = await procedimentosRes.json();

      if (clienteRes.ok) {
        setCliente(clienteData);
      }

      setProfissionais(Array.isArray(profissionaisData) ? profissionaisData : []);
      setProcedimentos(Array.isArray(procedimentosData) ? procedimentosData : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os dados para agendamento.");
    }
  }

  async function carregarHorarios() {
    setHorariosDisponiveis([]);
    setHorarioSelecionado("");

    if (!profissionalId || !dataSelecionada) {
      return;
    }

    try {
      const procedimentosQuery = procedimentoIds.join(",");

const response = await api(
  `/public/horarios-disponiveis?profissionalId=${profissionalId}&data=${dataSelecionada}&procedimentoIds=${procedimentosQuery}`
);

      const data = await response.json();

      if (Array.isArray(data)) {
        setHorariosDisponiveis(data);
      } else {
        setHorariosDisponiveis([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os horários disponíveis.");
    }
  }

  function alternarProcedimento(id: string) {
    setProcedimentoIds((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  async function criarAgendamento() {
    setMensagem("");
    setErro("");

    if (!cliente?.id) {
      setErro("Não foi possível identificar seu cadastro de cliente.");
      return;
    }

    if (!profissionalId || !dataSelecionada || !horarioSelecionado) {
      setErro("Selecione barbeiro, data e horário.");
      return;
    }

    if (procedimentoIds.length === 0) {
      setErro("Selecione ao menos um serviço.");
      return;
    }

    try {
      const response = await api("/atendimentos", {
        method: "POST",
        body: JSON.stringify({
          clienteId: cliente.id,
          profissionalId,
          data: `${dataSelecionada}T${horarioSelecionado}:00`,
          procedimentoIds,
          observacoes: "Agendamento criado pelo cliente.",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErro(result.message || "Não foi possível criar o agendamento.");
        return;
      }

      setMensagem("Agendamento solicitado com sucesso.");
      setProfissionalId("");
      setDataSelecionada("");
      setHorarioSelecionado("");
      setProcedimentoIds([]);
      setHorariosDisponiveis([]);
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao criar agendamento.");
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
  carregarHorarios();
}, [profissionalId, dataSelecionada, procedimentoIds]);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <span>BARBERFLOW BOOKING</span>
          <h1>Agendar horário</h1>
          <p>
            Escolha seu barbeiro, selecione os serviços desejados e veja somente
            horários disponíveis.
          </p>
        </section>

        {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
        {erro && <div className={styles.errorMessage}>{erro}</div>}

        <section className={styles.bookingGrid}>
          <div className={styles.formCard}>
            <h2>Dados do agendamento</h2>

            <div className={styles.form}>
              <select
                value={profissionalId}
                onChange={(event) => setProfissionalId(event.target.value)}
              >
                <option value="">Selecione o barbeiro</option>
                {profissionais.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome} - {profissional.especialidade}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dataSelecionada}
                onChange={(event) => setDataSelecionada(event.target.value)}
              />
            </div>

            <div className={styles.horariosBox}>
              <h3>Horários disponíveis</h3>

              <div className={styles.horariosGrid}>
                {horariosDisponiveis.length === 0 && (
                  <p className={styles.emptyHorarios}>
                    Selecione barbeiro e data para ver os horários.
                  </p>
                )}

                {horariosDisponiveis.map((horario) => (
                  <button
                    key={horario}
                    type="button"
                    onClick={() => setHorarioSelecionado(horario)}
                    className={
                      horarioSelecionado === horario
                        ? styles.horarioSelecionado
                        : styles.horarioItem
                    }
                  >
                    {horario}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.submitButton} onClick={criarAgendamento}>
              Solicitar agendamento
            </button>
          </div>

          <div className={styles.summaryCard}>
            <span>Resumo</span>

            <strong>
              {valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>

            <p>{duracaoTotal} minutos estimados</p>
            <p>{procedimentoIds.length} serviço(s) selecionado(s)</p>

            {dataSelecionada && horarioSelecionado && (
              <p>
                {new Date(
                  `${dataSelecionada}T${horarioSelecionado}:00`
                ).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </section>

        <section className={styles.servicesSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Serviços disponíveis</h2>
              <p>Selecione um ou mais serviços para o atendimento.</p>
            </div>
          </div>

          <div className={styles.servicesGrid}>
            {procedimentos.map((procedimento) => (
              <button
                key={procedimento.id}
                type="button"
                onClick={() => alternarProcedimento(procedimento.id)}
                className={
                  procedimentoIds.includes(procedimento.id)
                    ? styles.serviceSelected
                    : styles.serviceCard
                }
              >
                <span>{procedimento.categoria}</span>
                <h3>{procedimento.nome}</h3>
                <p>{procedimento.descricao || "Serviço BarberFlow."}</p>

                <div>
                  <strong>
                    {Number(procedimento.preco).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                  <small>{procedimento.duracao} min</small>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}