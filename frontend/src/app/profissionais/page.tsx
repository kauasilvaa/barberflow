"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

import { Sidebar } from "../../components/Sidebar";
import { API_URL } from "../../services/api";

type Profissional = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  especialidade: string;
  ativo: boolean;
};

export default function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  async function carregarProfissionais() {
    try {
      const response = await fetch(`${API_URL}/profissionais`);
      const data = await response.json();

      setProfissionais(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function cadastrarProfissional() {
    try {
      const response = await fetch(`${API_URL}/profissionais`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          especialidade,
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
      setEspecialidade("");

      carregarProfissionais();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarProfissionais();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.content}>
        <section className={styles.hero}>
          <span>TIME BARBERFLOW</span>

          <h1>Barbeiros da casa</h1>

          <p>
            Gerencie barbeiros, especialidades e disponibilidade da equipe em um
            painel premium para operação diária da barbearia.
          </p>
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Novo barbeiro</h2>
              <p>Cadastre profissionais responsáveis pelos atendimentos.</p>
            </div>
          </div>

          <div className={styles.form}>
            <input
              placeholder="Nome do barbeiro"
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
              placeholder="Especialidade. Ex: Corte degradê, barba, navalha"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
            />

            <button onClick={cadastrarProfissional}>Cadastrar barbeiro</button>
          </div>
        </section>

        <section className={styles.teamGrid}>
          {profissionais.map((profissional) => (
            <article key={profissional.id} className={styles.barberCard}>
              <div className={styles.avatar}>
                {profissional.nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{profissional.nome}</h3>
                <p>{profissional.especialidade}</p>
              </div>

              <div className={styles.barberInfo}>
                <span>{profissional.email}</span>
                <span>{profissional.telefone}</span>
              </div>

              <strong className={profissional.ativo ? styles.ativo : styles.inativo}>
                {profissional.ativo ? "Ativo" : "Inativo"}
              </strong>
            </article>
          ))}
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Barbeiros cadastrados</h2>
              <p>Controle administrativo completo da equipe.</p>
            </div>

            <span>{profissionais.length} barbeiros</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Especialidade</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {profissionais.map((profissional) => (
                  <tr key={profissional.id}>
                    <td>{profissional.nome}</td>
                    <td>{profissional.email}</td>
                    <td>{profissional.telefone}</td>
                    <td>{profissional.especialidade}</td>
                    <td>
                      <span
                        className={
                          profissional.ativo ? styles.ativoBadge : styles.inativoBadge
                        }
                      >
                        {profissional.ativo ? "Ativo" : "Inativo"}
                      </span>
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