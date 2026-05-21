"use client";

import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import { API_URL } from "../../services/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function recuperarSenha() {
    setMensagem("");
    setErro("");

    if (!email) {
      setErro("Informe seu email para recuperar a senha.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Não foi possível enviar a recuperação.");
        return;
      }

      setMensagem(
        data.message ||
          "Se existir uma conta vinculada a este email, as instruções foram enviadas."
      );
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
          onClick={() => router.push("/login")}
        >
          <ArrowLeft size={18} />
          Voltar para login
        </button>

        <div className={styles.brand}>
          <strong>BarberFlow</strong>
          <span>Recuperação de acesso</span>
        </div>

        <div className={styles.header}>
          <h1>Esqueceu sua senha?</h1>

          <p>
            Informe o email da sua conta para receber um link seguro de
            recuperação.
          </p>
        </div>

        {mensagem && (
          <div className={styles.successMessage}>{mensagem}</div>
        )}

        {erro && <div className={styles.errorMessage}>{erro}</div>}

        <div className={styles.form}>
          <label>
            <span>Email</span>

            <div className={styles.inputWrapper}>
              <Mail size={18} />

              <input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") recuperarSenha();
                }}
              />
            </div>
          </label>

          <button
            type="button"
            className={styles.submitButton}
            onClick={recuperarSenha}
            disabled={loading}
          >
            {loading ? "Enviando recuperação..." : "Enviar recuperação"}
          </button>
        </div>

        <div className={styles.infoBox}>
          <strong>Recuperação segura</strong>

          <p>
            Se o email estiver cadastrado, você receberá um link temporário para
            redefinir sua senha.
          </p>
        </div>
      </section>
    </main>
  );
}