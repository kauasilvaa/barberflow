"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

import { API_URL } from "../../services/api";

export default function RegisterPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function criarConta(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
  const mensagem =
    data.message?.includes("Can't reach database server") ||
    data.message?.includes("Invalid `prisma") ||
    data.message?.includes("Prisma")
      ? "Não foi possível conectar ao banco de dados no momento. Tente novamente em alguns instantes."
      : data.message || "Erro ao criar conta.";

  setErro(mensagem);
  setLoading(false);
  return;
}

      localStorage.setItem("barberflow_token", data.token);
      localStorage.setItem("barberflow_user", JSON.stringify(data.usuario));

      router.push("/");
    } catch (error) {
      console.error(error);

      setErro("Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow} />

      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>B</div>

          <span>BARBERFLOW</span>
        </div>

        <div className={styles.header}>
          <h1>Criar conta</h1>

          <p>
            Crie sua conta administrativa para acessar a plataforma BarberFlow.
          </p>
        </div>

        {erro && (
          <div className={styles.errorMessage}>
            {erro}
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={criarConta}
        >
          <div className={styles.inputGroup}>
            <label>Nome</label>

            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>

            <input
              type="email"
              placeholder="admin@barberflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Senha</label>

            <input
              type="password"
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Já possui conta?</span>

          <button
                onClick={() => {
                localStorage.removeItem("barberflow_token");
                localStorage.removeItem("barberflow_user");
                router.push("/login");
                }}
            >
                Entrar
</button>
        </div>
      </div>
    </div>
  );
}