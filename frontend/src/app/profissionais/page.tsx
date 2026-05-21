"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

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
  const [profissionalEditandoId, setProfissionalEditandoId] = useState<
    string | null
  >(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarProfissionais() {
    try {
      const response = await api("/profissionais");
      const data = await response.json();

      if (Array.isArray(data)) {
        setProfissionais(data);
      } else {
        setProfissionais([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os barbeiros.");
    }
  }

  function limparFormulario() {
    setProfissionalEditandoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setEspecialidade("");
    setAtivo(true);
  }

  function preencherFormulario(profissional: Profissional) {
    setProfissionalEditandoId(profissional.id);
    setNome(profissional.nome);
    setEmail(profissional.email);
    setTelefone(profissional.telefone);
    setEspecialidade(profissional.especialidade);
    setAtivo(profissional.ativo);
    setMensagem("");
    setErro("");
  }

  async function salvarProfissional() {
    setMensagem("");
    setErro("");

    if (!nome || !email || !telefone || !especialidade) {
      setErro("Preencha nome, email, telefone e especialidade.");
      return;
    }

    try {
      const rota = profissionalEditandoId
        ? `/profissionais/${profissionalEditandoId}`
        : "/profissionais";

      const metodo = profissionalEditandoId ? "PUT" : "POST";

      const response = await api(rota, {
        method: metodo,
        body: JSON.stringify({
          nome,
          email,
          telefone,
          especialidade,
          ativo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível salvar o barbeiro.");
        return;
      }

      setMensagem(
        profissionalEditandoId
          ? "Barbeiro atualizado com sucesso."
          : "Barbeiro cadastrado com sucesso."
      );

      limparFormulario();
      carregarProfissionais();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao salvar barbeiro.");
    }
  }

  async function excluirProfissional(profissional: Profissional) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o barbeiro ${profissional.nome}?`
    );

    if (!confirmar) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const response = await api(`/profissionais/${profissional.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.message || "Não foi possível excluir o barbeiro.");
        return;
      }

      setMensagem("Barbeiro excluído com sucesso.");

      if (profissionalEditandoId === profissional.id) {
        limparFormulario();
      }

      carregarProfissionais();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao excluir barbeiro.");
    }
  }

  useEffect(() => {
    carregarProfissionais();
  }, []);

  return (
    <div className={styles.container}>
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
              <h2>
                {profissionalEditandoId ? "Editar barbeiro" : "Novo barbeiro"}
              </h2>

              <p>
                {profissionalEditandoId
                  ? "Atualize os dados do profissional selecionado."
                  : "Cadastre profissionais responsáveis pelos atendimentos."}
              </p>
            </div>
          </div>

          {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
          {erro && <div className={styles.errorMessage}>{erro}</div>}

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

            <select
              value={ativo ? "ativo" : "inativo"}
              onChange={(e) => setAtivo(e.target.value === "ativo")}
              className={styles.select}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <button onClick={salvarProfissional}>
              {profissionalEditandoId
                ? "Salvar alterações"
                : "Cadastrar barbeiro"}
            </button>

            {profissionalEditandoId && (
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

              <strong
                className={profissional.ativo ? styles.ativo : styles.inativo}
              >
                {profissional.ativo ? "Ativo" : "Inativo"}
              </strong>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => preencherFormulario(profissional)}
                  className={styles.editButton}
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => excluirProfissional(profissional)}
                  className={styles.deleteButton}
                >
                  Excluir
                </button>
              </div>
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
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {profissionais.length === 0 && (
                  <tr>
                    <td colSpan={6}>Nenhum barbeiro cadastrado.</td>
                  </tr>
                )}

                {profissionais.map((profissional) => (
                  <tr key={profissional.id}>
                    <td>{profissional.nome}</td>
                    <td>{profissional.email}</td>
                    <td>{profissional.telefone}</td>
                    <td>{profissional.especialidade}</td>
                    <td>
                      <span
                        className={
                          profissional.ativo
                            ? styles.ativoBadge
                            : styles.inativoBadge
                        }
                      >
                        {profissional.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => preencherFormulario(profissional)}
                          className={styles.editButton}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirProfissional(profissional)}
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