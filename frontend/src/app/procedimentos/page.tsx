"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

import { Sidebar } from "../../components/Sidebar";
import { API_URL } from "../../services/api";

type Procedimento = {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  duracao: number;
  ativo: boolean;
};

export default function ProcedimentosPage() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  async function carregarProcedimentos() {
    try {
      const response = await fetch(`${API_URL}/procedimentos`);
      const data = await response.json();

      setProcedimentos(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function cadastrarProcedimento() {
    try {
      const response = await fetch(`${API_URL}/procedimentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          descricao,
          categoria,
          preco: Number(preco),
          duracao: Number(duracao),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message);
        return;
      }

      setNome("");
      setDescricao("");
      setCategoria("");
      setPreco("");
      setDuracao("");

      carregarProcedimentos();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarProcedimentos();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.content}>
        <section className={styles.hero}>
          <span>CATÁLOGO BARBERFLOW</span>

          <h1>Serviços da barbearia</h1>

          <p>
            Organize cortes, barba, tratamentos e combos premium com preço,
            duração, categoria e status operacional.
          </p>
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Novo serviço</h2>
              <p>Cadastre os serviços oferecidos pela barbearia.</p>
            </div>
          </div>

          <div className={styles.form}>
            <input
              placeholder="Nome do serviço. Ex: Corte degradê"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              placeholder="Categoria. Ex: Corte, Barba, Combo"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />

            <input
              placeholder="Preço"
              type="number"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />

            <input
              placeholder="Duração em minutos"
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
            />

            <textarea
              placeholder="Descrição do serviço"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <button onClick={cadastrarProcedimento}>Cadastrar serviço</button>
          </div>
        </section>

        <section className={styles.servicesGrid}>
          {procedimentos.map((procedimento) => (
            <article key={procedimento.id} className={styles.serviceCard}>
              <div className={styles.serviceTop}>
                <span>{procedimento.categoria}</span>

                <strong className={procedimento.ativo ? styles.ativo : styles.inativo}>
                  {procedimento.ativo ? "Ativo" : "Inativo"}
                </strong>
              </div>

              <h3>{procedimento.nome}</h3>

              <p>{procedimento.descricao || "Serviço cadastrado no BarberFlow."}</p>

              <div className={styles.serviceMeta}>
                <div>
                  <span>Preço</span>
                  <strong>
                    {procedimento.preco.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </div>

                <div>
                  <span>Duração</span>
                  <strong>{procedimento.duracao} min</strong>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Serviços cadastrados</h2>
              <p>Catálogo operacional da barbearia.</p>
            </div>

            <span>{procedimentos.length} serviços</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Serviço</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Duração</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {procedimentos.map((procedimento) => (
                  <tr key={procedimento.id}>
                    <td>{procedimento.nome}</td>
                    <td>{procedimento.categoria}</td>
                    <td>
                      {procedimento.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td>{procedimento.duracao} min</td>
                    <td>
                      <span
                        className={
                          procedimento.ativo ? styles.ativoBadge : styles.inativoBadge
                        }
                      >
                        {procedimento.ativo ? "Ativo" : "Inativo"}
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