"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [clienteEditandoId, setClienteEditandoId] = useState<string | null>(
    null
  );

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarClientes() {
    try {
      const response = await api("/clientes");
      const data = await response.json();

      if (Array.isArray(data)) {
        setClientes(data);
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os clientes.");
    }
  }

  function limparFormulario() {
    setClienteEditandoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setCpf("");
  }

  function preencherFormulario(cliente: Cliente) {
    setClienteEditandoId(cliente.id);
    setNome(cliente.nome);
    setEmail(cliente.email);
    setTelefone(cliente.telefone);
    setCpf(cliente.cpf ?? "");
    setMensagem("");
    setErro("");
  }

  async function salvarCliente() {
    setMensagem("");
    setErro("");

    if (!nome || !email || !telefone) {
      setErro("Preencha nome, email e telefone.");
      return;
    }

    try {
      const rota = clienteEditandoId
        ? `/clientes/${clienteEditandoId}`
        : "/clientes";

      const metodo = clienteEditandoId ? "PUT" : "POST";

      const response = await api(rota, {
        method: metodo,
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf: cpf || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível salvar o cliente.");
        return;
      }

      setMensagem(
        clienteEditandoId
          ? "Cliente atualizado com sucesso."
          : "Cliente cadastrado com sucesso."
      );

      limparFormulario();
      carregarClientes();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao salvar cliente.");
    }
  }

  async function excluirCliente(cliente: Cliente) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente ${cliente.nome}?`
    );

    if (!confirmar) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const response = await api(`/clientes/${cliente.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.message || "Não foi possível excluir o cliente.");
        return;
      }

      setMensagem("Cliente excluído com sucesso.");

      if (clienteEditandoId === cliente.id) {
        limparFormulario();
      }

      carregarClientes();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao excluir cliente.");
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <section className={styles.hero}>
          <span>CLIENTES BARBERFLOW</span>

          <h1>Clientes da barbearia</h1>

          <p>
            Cadastre, edite e acompanhe os clientes da barbearia com uma base
            organizada, profissional e pronta para histórico de agendamentos.
          </p>
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{clienteEditandoId ? "Editar cliente" : "Novo cliente"}</h2>

              <p>
                {clienteEditandoId
                  ? "Atualize os dados do cliente selecionado."
                  : "Adicione um novo cliente à base da barbearia."}
              </p>
            </div>
          </div>

          {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
          {erro && <div className={styles.errorMessage}>{erro}</div>}

          <div className={styles.form}>
            <input
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />

            <button onClick={salvarCliente}>
              {clienteEditandoId ? "Salvar alterações" : "Cadastrar cliente"}
            </button>

            {clienteEditandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className={styles.secondaryButton}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Clientes cadastrados</h2>
              <p>Lista de clientes registrados no BarberFlow.</p>
            </div>

            <span>{clientes.length} clientes</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>CPF</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={5}>Nenhum cliente cadastrado.</td>
                  </tr>
                )}

                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.cpf || "-"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => preencherFormulario(cliente)}
                          className={styles.editButton}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirCliente(cliente)}
                          className={styles.deleteButton}
                        >
                          Excluir
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