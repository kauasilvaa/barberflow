"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import { api } from "../../services/api";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function alterarSenha() {
    setErro("");
    setSucesso("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação da senha não confere.");
      return;
    }

    try {
      setLoading(true);

      const response = await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Erro ao alterar senha.");
        return;
      }

      setSucesso("Senha alterada com sucesso.");

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div className={styles.header}>
          <span>SEGURANÇA</span>

          <h1>Alterar senha</h1>

          <p>
            Atualize sua senha para manter sua conta protegida.
          </p>
        </div>

        {erro && (
          <div className={styles.errorMessage}>
            {erro}
          </div>
        )}

        {sucesso && (
          <div className={styles.successMessage}>
            {sucesso}
          </div>
        )}

        <div className={styles.form}>
          <label>
            <span>Senha atual</span>

            <div className={styles.inputWrapper}>
              <Lock size={18} />

              <input
                type={mostrarAtual ? "text" : "password"}
                placeholder="Digite sua senha atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarAtual(!mostrarAtual)}
              >
                {mostrarAtual ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <label>
            <span>Nova senha</span>

            <div className={styles.inputWrapper}>
              <Lock size={18} />

              <input
                type={mostrarNova ? "text" : "password"}
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarNova(!mostrarNova)}
              >
                {mostrarNova ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <label>
            <span>Confirmar nova senha</span>

            <div className={styles.inputWrapper}>
              <Lock size={18} />

              <input
                type={mostrarConfirmacao ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) =>
                  setConfirmarSenha(e.target.value)
                }
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacao(!mostrarConfirmacao)
                }
              >
                {mostrarConfirmacao ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="button"
            className={styles.submitButton}
            onClick={alterarSenha}
            disabled={loading}
          >
            {loading
              ? "Alterando senha..."
              : "Salvar nova senha"}
          </button>
        </div>
      </section>
    </main>
  );
}