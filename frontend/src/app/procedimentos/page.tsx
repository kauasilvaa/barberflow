"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { api } from "../../services/api";

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
  const [procedimentoEditandoId, setProcedimentoEditandoId] = useState<
    string | null
  >(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarProcedimentos() {
    try {
      const response = await api("/procedimentos");
      const data = await response.json();

      if (Array.isArray(data)) {
        setProcedimentos(data);
      } else {
        setProcedimentos([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os serviços.");
    }
  }

  function limparFormulario() {
    setProcedimentoEditandoId(null);
    setNome("");
    setDescricao("");
    setCategoria("");
    setPreco("");
    setDuracao("");
    setAtivo(true);
  }

  function preencherFormulario(procedimento: Procedimento) {
    setProcedimentoEditandoId(procedimento.id);
    setNome(procedimento.nome);
    setDescricao(procedimento.descricao ?? "");
    setCategoria(procedimento.categoria);
    setPreco(String(procedimento.preco));
    setDuracao(String(procedimento.duracao));
    setAtivo(procedimento.ativo);
    setMensagem("");
    setErro("");
  }

  async function salvarProcedimento() {
    setMensagem("");
    setErro("");

    if (!nome || !categoria || !preco || !duracao) {
      setErro("Preencha nome, categoria, preço e duração.");
      return;
    }

    if (Number(preco) <= 0 || Number(duracao) <= 0) {
      setErro("Preço e duração devem ser maiores que zero.");
      return;
    }

    try {
      const rota = procedimentoEditandoId
        ? `/procedimentos/${procedimentoEditandoId}`
        : "/procedimentos";

      const metodo = procedimentoEditandoId ? "PUT" : "POST";

      const response = await api(rota, {
        method: metodo,
        body: JSON.stringify({
          nome,
          descricao: descricao || undefined,
          categoria,
          preco: Number(preco),
          duracao: Number(duracao),
          ativo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível salvar o serviço.");
        return;
      }

      setMensagem(
        procedimentoEditandoId
          ? "Serviço atualizado com sucesso."
          : "Serviço cadastrado com sucesso."
      );

      limparFormulario();
      carregarProcedimentos();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao salvar serviço.");
    }
  }

  async function excluirProcedimento(procedimento: Procedimento) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o serviço ${procedimento.nome}?`
    );

    if (!confirmar) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const response = await api(`/procedimentos/${procedimento.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setErro(data.message || "Não foi possível excluir o serviço.");
        return;
      }

      setMensagem("Serviço excluído com sucesso.");

      if (procedimentoEditandoId === procedimento.id) {
        limparFormulario();
      }

      carregarProcedimentos();
    } catch (error) {
      console.error(error);
      setErro("Erro inesperado ao excluir serviço.");
    }
  }

  useEffect(() => {
    carregarProcedimentos();
  }, []);

  return (
    <div className={styles.container}>
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
              <h2>
                {procedimentoEditandoId ? "Editar serviço" : "Novo serviço"}
              </h2>

              <p>
                {procedimentoEditandoId
                  ? "Atualize os dados do serviço selecionado."
                  : "Cadastre os serviços oferecidos pela barbearia."}
              </p>
            </div>
          </div>

          {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
          {erro && <div className={styles.errorMessage}>{erro}</div>}

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
              min="0"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />

            <input
              placeholder="Duração em minutos"
              type="number"
              min="1"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
            />

            <select
              value={ativo ? "ativo" : "inativo"}
              onChange={(e) => setAtivo(e.target.value === "ativo")}
              className={styles.select}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <textarea
              placeholder="Descrição do serviço"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <button onClick={salvarProcedimento}>
              {procedimentoEditandoId
                ? "Salvar alterações"
                : "Cadastrar serviço"}
            </button>

            {procedimentoEditandoId && (
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

        <section className={styles.servicesGrid}>
          {procedimentos.map((procedimento) => (
            <article key={procedimento.id} className={styles.serviceCard}>
              <div className={styles.serviceTop}>
                <span>{procedimento.categoria}</span>

                <strong
                  className={procedimento.ativo ? styles.ativo : styles.inativo}
                >
                  {procedimento.ativo ? "Ativo" : "Inativo"}
                </strong>
              </div>

              <h3>{procedimento.nome}</h3>

              <p>
                {procedimento.descricao || "Serviço cadastrado no BarberFlow."}
              </p>

              <div className={styles.serviceMeta}>
                <div>
                  <span>Preço</span>
                  <strong>
                    {Number(procedimento.preco ?? 0).toLocaleString("pt-BR", {
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

              <div className={styles.cardActions}>
                <button
                  type="button"
                  onClick={() => preencherFormulario(procedimento)}
                  className={styles.editButton}
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => excluirProcedimento(procedimento)}
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
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {procedimentos.length === 0 && (
                  <tr>
                    <td colSpan={6}>Nenhum serviço cadastrado.</td>
                  </tr>
                )}

                {procedimentos.map((procedimento) => (
                  <tr key={procedimento.id}>
                    <td>{procedimento.nome}</td>
                    <td>{procedimento.categoria}</td>
                    <td>
                      {Number(procedimento.preco ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td>{procedimento.duracao} min</td>
                    <td>
                      <span
                        className={
                          procedimento.ativo
                            ? styles.ativoBadge
                            : styles.inativoBadge
                        }
                      >
                        {procedimento.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => preencherFormulario(procedimento)}
                          className={styles.editButton}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirProcedimento(procedimento)}
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