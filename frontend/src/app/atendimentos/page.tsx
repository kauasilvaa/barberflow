"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

import { Sidebar } from "../../components/Sidebar";
import { API_URL } from "../../services/api";

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

  const valorTotal = useMemo(() => {
    return procedimentos
      .filter((procedimento) => procedimentoIds.includes(procedimento.id))
      .reduce((total, procedimento) => total + procedimento.preco, 0);
  }, [procedimentos, procedimentoIds]);

  async function carregarDados() {
    const [clientesRes, profissionaisRes, procedimentosRes, atendimentosRes] =
      await Promise.all([
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/profissionais`),
        fetch(`${API_URL}/procedimentos`),
        fetch(`${API_URL}/atendimentos`),
      ]);

    setClientes(await clientesRes.json());
    setProfissionais(await profissionaisRes.json());
    setProcedimentos(await procedimentosRes.json());
    setAtendimentos(await atendimentosRes.json());
  }

  async function criarAtendimento() {
    const response = await fetch(`${API_URL}/atendimentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId,
        profissionalId,
        data,
        procedimentoIds,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message);
      return;
    }

    if (result.sugestao) {
      alert(result.sugestao.message);
    }

    setClienteId("");
    setProfissionalId("");
    setData("");
    setProcedimentoIds([]);

    carregarDados();
  }

  async function confirmarAtendimento(id: string) {
    try {
      await fetch(`${API_URL}/atendimentos/${id}/confirmar`, {
        method: "PATCH",
      });

      carregarDados();
    } catch (error) {
      console.error(error);
    }
  }

  async function cancelarAtendimento(id: string) {
    try {
      const response = await fetch(`${API_URL}/atendimentos/${id}/cancelar`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      carregarDados();
    } catch (error) {
      console.error(error);
    }
  }

  async function realizarAtendimento(id: string) {
    try {
      await fetch(`${API_URL}/atendimentos/${id}/realizar`, {
        method: "PATCH",
      });

      carregarDados();
    } catch (error) {
      console.error(error);
    }
  }

  function alternarProcedimento(id: string) {
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
      <Sidebar />

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
              <h2>Novo agendamento</h2>
              <p>Selecione cliente, barbeiro, data e serviços desejados.</p>
            </div>

            <strong>
              {valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>

          <div className={styles.form}>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
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
          </div>

          <div className={styles.procedimentosBox}>
            <h3>Serviços selecionados</h3>

            <div className={styles.procedimentosGrid}>
              {procedimentos.map((procedimento) => (
                <button
                  key={procedimento.id}
                  type="button"
                  className={
                    procedimentoIds.includes(procedimento.id)
                      ? styles.procedimentoSelecionado
                      : styles.procedimentoItem
                  }
                  onClick={() => alternarProcedimento(procedimento.id)}
                >
                  <strong>{procedimento.nome}</strong>

                  <span>
                    {procedimento.preco.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    • {procedimento.duracao} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className={styles.submitButton} onClick={criarAtendimento}>
            Criar agendamento
          </button>
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
                {atendimentos.map((atendimento) => (
                  <tr key={atendimento.id}>
                    <td>{new Date(atendimento.data).toLocaleString("pt-BR")}</td>
                    <td>{atendimento.cliente.nome}</td>
                    <td>{atendimento.profissional.nome}</td>
                    <td>
                      {atendimento.procedimentos
                        .map((item) => item.procedimento.nome)
                        .join(", ")}
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
                    <td>
                      <div className={styles.actions}>
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