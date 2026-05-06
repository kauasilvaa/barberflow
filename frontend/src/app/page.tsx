"use client";


import { useEffect, useState } from "react";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
};

type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
};

type Agendamento = {
  id: string;
  data: string;
  status: string;
  cliente: Cliente;
  servicos: {
    servico: Servico;
  }[];
};

const API_URL = "http://127.0.0.1:3333";

export default function Home() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [dashboard, setDashboard] = useState<any>(null);

  async function carregarDados() {
  const [clientesRes, servicosRes, agendamentosRes, dashboardRes] = await Promise.all([
    fetch(`${API_URL}/clientes`),
    fetch(`${API_URL}/servicos`),
    fetch(`${API_URL}/agendamentos`),
    fetch(`${API_URL}/dashboard`),
  ]);

  setClientes(await clientesRes.json());
  setServicos(await servicosRes.json());
  setAgendamentos(await agendamentosRes.json());
  setDashboard(await dashboardRes.json());
}

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();

    await fetch(`${API_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone }),
    });

    setNome("");
    setEmail("");
    setTelefone("");
    carregarDados();
  }

  async function criarAgendamento(e: React.FormEvent) {
  e.preventDefault();

  const resposta = await fetch(`${API_URL}/agendamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clienteId,
      servicoIds: [servicoId],
      data: new Date(data).toISOString(),
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    alert(resultado.message || "Não foi possível criar o agendamento");
    return;
  }

  if (resultado.sugestao) {
    alert(
      `${resultado.sugestao.message}\nData sugerida: ${new Date(
        resultado.sugestao.dataSugerida
      ).toLocaleString("pt-BR")}`
    );
  } else {
    alert("Agendamento criado com sucesso");
  }

  setClienteId("");
  setServicoId("");
  setData("");
  carregarDados();
}
  async function cancelarAgendamento(id: string) {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/cancelar`, {
      method: "PATCH",
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      alert(resultado.message || "Não foi possível cancelar o agendamento");
      return;
    }

    alert("Agendamento cancelado com sucesso");
    carregarDados();
  }

  async function filtrarAgendamentos() {
    if (!dataInicio || !dataFim) {
      alert("Informe a data inicial e a data final");
      return;
    }

    const resposta = await fetch(
      `${API_URL}/agendamentos/filtro?dataInicio=${dataInicio}&dataFim=${dataFim}`
    );

    const resultado = await resposta.json();
    setAgendamentos(resultado);
  }

 async function confirmarAgendamento(id: string) {
  console.log("ID enviado:", id);

  const resposta = await fetch(`${API_URL}/agendamentos/${id}/confirmar`, {
    method: "PATCH",
  });

  console.log("Status:", resposta.status);

  const resultado = await resposta.json();
  console.log("Resposta:", resultado);

  if (!resposta.ok) {
    alert(resultado.message || "Erro");
    return;
  }

  carregarDados();
}

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="page">
<header className="hero">
  <div>
    <span className="tag">Sistema de agendamentos</span>
    <h1>Leila Salão de Beleza</h1>
    <p>
      Controle de clientes, serviços e agendamentos com regras de alteração,
      cancelamento e histórico por período.
    </p>
  </div>

  {dashboard && (
    <div className="dashboard">
      <div>
        <strong>{dashboard.total}</strong>
        <span>Total</span>
      </div>

      <div>
        <strong>{dashboard.confirmados}</strong>
        <span>Confirmados</span>
      </div>

      <div>
        <strong>{dashboard.pendentes}</strong>
        <span>Pendentes</span>
      </div>

      <div>
        <strong>{dashboard.cancelados}</strong>
        <span>Cancelados</span>
      </div>
    </div>
  )}
</header>

      <section className="grid">
        <div className="card">
          <h2>Cadastrar Cliente</h2>

          <form onSubmit={criarCliente} className="form">
            <input
              placeholder="Nome do cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />

            <button type="submit">Cadastrar cliente</button>
          </form>
        </div>

        <div className="card">
          <h2>Novo Agendamento</h2>

          <form onSubmit={criarAgendamento} className="form">
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>

            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              required
            >
              <option value="">Selecione um serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} - R$ {servico.preco.toFixed(2)}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />

            <button type="submit">Cadastrar agendamento</button>
          </form>
        </div>
      </section>

      <section className="card full">
        <div className="section-title">
          <div>
            <h2>Agendamentos</h2>
            <p>Consulte, visualize detalhes e cancele agendamentos.</p>
          </div>
          <span>{agendamentos.length} registros</span>
        </div>

        <div className="form" style={{ marginBottom: 20 }}>
          <div className="grid">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={filtrarAgendamentos}>
              Filtrar por período
            </button>

            <button type="button" onClick={carregarDados}>
              Limpar filtro
            </button>
          </div>
        </div>

        <div className="table">
          {agendamentos.map((agendamento) => (
            <div key={agendamento.id} className="row">
              <div>
                <strong>{agendamento.cliente.nome}</strong>
                <p>
                  Cliente: {agendamento.cliente.email} |{" "}
                  {agendamento.cliente.telefone}
                </p>
                <p>
                  Serviços:{" "}
                  {agendamento.servicos
                    .map((item) => item.servico.nome)
                    .join(", ")}
                </p>
              </div>

              <div>
                <strong>Data e horário</strong>
                <p>{new Date(agendamento.data).toLocaleString("pt-BR")}</p>
              </div>

              <span className={`status ${agendamento.status.toLowerCase()}`}>
                {agendamento.status}
              </span>

                            <div style={{ display: "flex", gap: 8 }}>
                            <button
  type="button"
  onClick={() => confirmarAgendamento(agendamento.id)}
  disabled={agendamento.status !== "PENDENTE"}
>
  Confirmar
</button>

  <button
    className="danger"
    type="button"
    onClick={() => cancelarAgendamento(agendamento.id)}
    disabled={agendamento.status === "CANCELADO"}
  >
    {agendamento.status === "CANCELADO" ? "Cancelado" : "Cancelar"}
  </button>
</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card full">
        <div className="section-title">
          <h2>Clientes</h2>
          <span>{clientes.length} cadastrados</span>
        </div>

        <div className="clients">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="client">
              <strong>{cliente.nome}</strong>
              <span>{cliente.email}</span>
              <span>{cliente.telefone}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}