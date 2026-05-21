"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import { API_URL } from "../../services/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function entrar() {
    setErro("");

    if (!email || !senha) {
      setErro("Informe email e senha para continuar.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || "Email ou senha inválidos.");
        return;
      }

      localStorage.setItem("barberflow_token", data.token);
      localStorage.setItem("barberflow_user", JSON.stringify(data.usuario));

      router.push(data.usuario?.role === "ADMIN" ? "/" : "/agendar");
    } catch (error) {
      console.error(error);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.leftPanel}>
        <div className={styles.logoBox}>B</div>

        <div>
          <span className={styles.badge}>BARBERFLOW PREMIUM</span>

          <h1>Gestão inteligente para barbearias modernas.</h1>

          <p>
            Controle agenda, clientes, barbeiros, serviços e faturamento em uma
            plataforma com experiência premium.
          </p>
        </div>

        <div className={styles.features}>
          <div>
            <strong>Agenda inteligente</strong>
            <span>Horários, conflitos e disponibilidade automática.</span>
          </div>

          <div>
            <strong>Área do cliente</strong>
            <span>Agendamento, remarcação e acompanhamento em tempo real.</span>
          </div>

          <div>
            <strong>Painel administrativo</strong>
            <span>Indicadores, calendário, equipe e operação completa.</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.brand}>
          <div>
            <strong>BarberFlow</strong>
            <span>Premium Barbershop</span>
          </div>
        </div>

        <div className={styles.header}>
          <h2>Acesse sua conta</h2>

          <p>Entre para continuar para o painel BarberFlow.</p>
        </div>

        {erro && <div className={styles.errorMessage}>{erro}</div>}

        <div className={styles.form}>
          <label className={styles.inputGroup}>
            <span>Email</span>

            <div className={styles.inputWrapper}>
              <Mail size={18} />

              <input
                placeholder="Digite seu email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") entrar();
                }}
              />
            </div>
          </label>

          <label className={styles.inputGroup}>
            <span>Senha</span>

            <div className={styles.inputWrapper}>
              <Lock size={18} />

              <input
                placeholder="Digite sua senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") entrar();
                }}
              />

              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className={styles.options}>
            <label>
              <input type="checkbox" />
              <span>Lembrar sessão</span>
            </label>

            <button type="button" onClick={() => router.push("/forgot-password")}>
              Esqueci minha senha
            </button>
          </div>

          <button
            type="button"
            className={styles.submitButton}
            onClick={entrar}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar no BarberFlow"}
          </button>
        </div>

        <div className={styles.footer}>
          <span>Não possui conta?</span>

          <button type="button" onClick={() => router.push("/register")}>
            Criar conta
          </button>
        </div>
      </section>
    </main>
  );
}