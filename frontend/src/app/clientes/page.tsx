"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

import { Sidebar } from "../../components/Sidebar";
import { API_URL } from "../../services/api";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  async function carregarClientes() {
    try {
      const response = await fetch(`${API_URL}/clientes`);
      const data = await response.json();

      setClientes(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function cadastrarCliente() {
    try {
      const response = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message);
        return;
      }

      setNome("");
      setEmail("");
      setTelefone("");
      setCpf("");

      carregarClientes();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.content}>
        <section className={styles.hero}>
          <span>CLIENTES BARBERFLOW</span>

          <h1>Clientes da barbearia</h1>

          <p>
            Cadastre e acompanhe os clientes da barbearia com uma base
            organizada, profissional e pronta para histórico de agendamentos.
          </p>
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Novo cliente</h2>
              <p>Adicione um novo cliente à base da barbearia.</p>
            </div>
          </div>

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

            <button onClick={cadastrarCliente}>Cadastrar cliente</button>
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
                </tr>
              </thead>

              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.cpf || "-"}</td>
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