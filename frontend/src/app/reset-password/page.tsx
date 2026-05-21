"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.css";
import { API_URL } from "../../services/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function redefinirSenha() {
    setMensagem("");
    setErro("");

    if (!token) {
      setErro("Token de recuperação inválido.");
      return;
    }

    if (!novaSenha || !confirmarSenha) {
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

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          novaSenha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível redefinir a senha.");
        return;
      }

      setMensagem("Senha redefinida com sucesso. Você já pode fazer login.");
      setNovaSenha("");
      setConfirmarSenha("");

      setTimeout(() => {
        router.push("/login");
      }, 1800);
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
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/login")}
        >
          <ArrowLeft size={18} />
          Voltar para login
        </button>

        <div className={styles.brand}>
          <strong>BarberFlow</strong>
          <span>Redefinição de senha</span>
        </div>

        <div className={styles.header}>
          <h1>Crie uma nova senha</h1>

          <p>
            Informe uma nova senha segura para recuperar o acesso à sua conta.
          </p>
        </div>

        {mensagem && <div className={styles.successMessage}>{mensagem}</div>}
        {erro && <div className={styles.errorMessage}>{erro}</div>}

        <div className={styles.form}>
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
                {mostrarNova ? <EyeOff size={18} /> : <Eye size={18} />}
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
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
              >
                {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="button"
            className={styles.submitButton}
            onClick={redefinirSenha}
            disabled={loading}
          >
            {loading ? "Redefinindo senha..." : "Redefinir senha"}
          </button>
        </div>
      </section>
    </main>
  );
}