"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

type Cliente = {
  id: string;
  nome: string;
};

type Profissional = {
  id: string;
  nome: string;
  especialidade: string;
};

type Procedimento = {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
};

type Atendimento = {
  id: string;
  data: string;
  status: string;
  valorTotal: number;
  cliente: Cliente;
  profissional: Profissional;
  procedimentos: {
    procedimento: Procedimento;
  }[];
};

export default function AtendimentosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState("");
  const [procedimentoIds, setProcedimentoIds] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [atendimentoEditandoId, setAtendimentoEditandoId] = useState<
    string | null
  >(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const valorTotal = useMemo(() => {
    return procedimentos
      .filter((procedimento) => procedimentoIds.includes(procedimento.id))
      .reduce((total, procedimento) => total + Number(procedimento.preco), 0);
  }, [procedimentos, procedimentoIds]);

  async function carregarDados() {
    try {
      const [clientesRes, profissionaisRes, procedimentosRes, atendimentosRes] =
        await Promise.all([
          api("/clientes"),
          api("/profissionais"),
          api("/procedimentos"),
          api("/atendimentos"),
        ]);

      const clientesData = await clientesRes.json();
      const profissionaisData = await profissionaisRes.json();
      const procedimentosData = await procedimentosRes.json();
      const atendimentosData = await atendimentosRes.json();

      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setProfissionais(
        Array.isArray(profissionaisData) ? profissionaisData : []
      );
      setProcedimentos(
        Array.isArray(procedimentosData) ? procedimentosData : []
      );
      setAtendimentos(Array.isArray(atendimentosData) ? atendimentosData : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os dados da agenda.");
    }
  }

  function limparFormulario() {
    setAtendimentoEditandoId(null);
    setClienteId("");
    setProfissionalId("");
    setData("");
    setProcedimentoIds([]);
    setObservacoes("");
  }

  function formatarDataParaInput(dataISO: string) {
    const dataObj = new Date(dataISO);
    const offset = dataObj.getTimezoneOffset();
    const localDate = new Date(dataObj.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  }

  function preencherFormularioEdicao(atendimento: Atendimento) {
    setAtendimentoEditandoId(atendimento.id);
    setClienteId(atendimento.cliente.id);
    setProfissionalId(atendimento.profissional.id);
    setData(formatarDataParaInput(atendimento.data));
    setProcedimentoIds(
      atendimento.procedimentos.map((item) => item.procedimento.id)
    );
    setObservacoes("");
    setMensagem("");
    setErro("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function salvarAtendimento() {
    setMensagem("");
    setErro("");

    if (!clienteId || !profissionalId || !data) {
      setErro("Selecione cliente, barbeiro e data.");
      return;
    }

    if (!atendimentoEditandoId && procedimentoIds.length === 0) {
      setErro("Selecione ao menos um serviço.");
      return;
    }

    try {
      const response = await api(
        atendimentoEditandoId
          ? `/atendimentos/${atendimentoEditandoId}`
          : "/atendimentos",
        {
          method: atendimentoEditandoId ? "PUT" : "POST",
          body: JSON.stringify(
            atendimentoEditandoId
              ? {
                  data,
                  profissionalId,
                  observacoes,
                }
              : {
                  clienteId,
                  profissionalId,
                  data,
                  procedimentoIds,
                  observacoes,
                }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErro(result.message || "Não foi possível salvar o agendamento.");
        return;
      }

      if (result.sugestao) {
        setMensagem(result.sugestao.message);
      } else {
        setMensagem(
          atendimentoEditandoId
            ? "Agendamento atualizado com sucesso."
            : "Agendamento criado com sucesso."
        );
      }

      limparFormulario();
      carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao salvar agendamento.");
    }
  }

  async function confirmarAtendimento(id: string) {
    setMensagem("");
    setErro("");

    try {
      const response = await api(`/atendimentos/${id}/confirmar`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível confirmar o atendimento.");
        return;
      }

      setMensagem("Agendamento confirmado com sucesso.");
      carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao confirmar atendimento.");
    }
  }

  async function realizarAtendimento(id: string) {
    setMensagem("");
    setErro("");

    try {
      const response = await api(`/atendimentos/${id}/realizar`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível realizar o atendimento.");
        return;
      }

      setMensagem("Atendimento marcado como realizado.");
      carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao realizar atendimento.");
    }
  }

  async function cancelarAtendimento(id: string) {
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
        setErro(data.message || "Não foi possível cancelar o atendimento.");
        return;
      }

      setMensagem("Agendamento cancelado com sucesso.");
      carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao cancelar atendimento.");
    }
  }

  function alternarProcedimento(id: string) {
    if (atendimentoEditandoId) {
      return;
    }

    if (procedimentoIds.includes(id)) {
      setProcedimentoIds(procedimentoIds.filter((item) => item !== id));
    } else {
      setProcedimentoIds([...procedimentoIds, id]);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <span>AGENDA BARBERFLOW</span>

          <h1>Agendamentos da barbearia</h1>

          <p>
            Crie, acompanhe e finalize horários com cliente, barbeiro, serviços
            selecionados, valor total e status operacional.
          </p>
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>
                {atendimentoEditandoId
                  ? "Editar agendamento"
                  : "Novo agendamento"}
              </h2>

              <p>
                {atendimentoEditandoId
                  ? "Atualize data, barbeiro e observações do agendamento."
                  : "Selecione cliente, barbeiro, data e serviços desejados."}
              </p>
            </div>

            <strong>
              {valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>

          {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
          {erro && <div className={styles.errorMessage}>{erro}</div>}

          <div className={styles.form}>
            <select
              value={clienteId}
              disabled={!!atendimentoEditandoId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecione o cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>

            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
            >
              <option value="">Selecione o barbeiro</option>
              {profissionais.map((profissional) => (
                <option key={profissional.id} value={profissional.id}>
                  {profissional.nome} - {profissional.especialidade}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <div className={styles.totalBox}>
              <span>Valor do agendamento</span>
              <strong>
                {valorTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <textarea
              placeholder="Observações do atendimento"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.procedimentosBox}>
            <h3>Serviços selecionados</h3>

            <div className={styles.procedimentosGrid}>
              {procedimentos.map((procedimento) => (
                <button
                  key={procedimento.id}
                  type="button"
                  disabled={!!atendimentoEditandoId}
                  className={
                    procedimentoIds.includes(procedimento.id)
                      ? styles.procedimentoSelecionado
                      : styles.procedimentoItem
                  }
                  onClick={() => alternarProcedimento(procedimento.id)}
                >
                  <strong>{procedimento.nome}</strong>

                  <span>
                    {Number(procedimento.preco ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    • {procedimento.duracao} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className={styles.submitButton} onClick={salvarAtendimento}>
            {atendimentoEditandoId ? "Salvar alterações" : "Criar agendamento"}
          </button>

          {atendimentoEditandoId && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={limparFormulario}
            >
              Cancelar edição
            </button>
          )}
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Agenda operacional</h2>
              <p>Controle dos horários, status e ações da barbearia.</p>
            </div>

            <span>{atendimentos.length} agendamentos</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Barbeiro</th>
                  <th>Serviços</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {atendimentos.length === 0 && (
                  <tr>
                    <td colSpan={7}>Nenhum agendamento cadastrado.</td>
                  </tr>
                )}

                {atendimentos.map((atendimento) => (
                  <tr key={atendimento.id}>
                    <td>{new Date(atendimento.data).toLocaleString("pt-BR")}</td>

                    <td>{atendimento.cliente?.nome ?? "Sem cliente"}</td>

                    <td>{atendimento.profissional?.nome ?? "Sem barbeiro"}</td>

                    <td>
                      {atendimento.procedimentos
                        ?.map((item) => item.procedimento.nome)
                        .join(", ") || "-"}
                    </td>

                    <td>
                      {Number(atendimento.valorTotal ?? 0).toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        }
                      )}
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

                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editar}
                          onClick={() => preencherFormularioEdicao(atendimento)}
                        >
                          Editar
                        </button>

                        <button
                          className={styles.confirmar}
                          onClick={() => confirmarAtendimento(atendimento.id)}
                        >
                          Confirmar
                        </button>

                        <button
                          className={styles.realizar}
                          onClick={() => realizarAtendimento(atendimento.id)}
                        >
                          Realizar
                        </button>

                        <button
                          className={styles.cancelar}
                          onClick={() => cancelarAtendimento(atendimento.id)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}