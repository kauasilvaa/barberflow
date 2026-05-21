"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";

import styles from "./page.module.css";
import { api } from "../../services/api";

moment.locale("pt-br");

const localizer = momentLocalizer(moment);

type Atendimento = {
  id: string;
  data: string;
  status: string;
  valorTotal: number;
  cliente: { nome: string };
  profissional: { nome: string; especialidade: string };
  procedimentos: {
    procedimento: {
      nome: string;
      duracao: number;
    };
  }[];
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Atendimento;
};

export default function CalendarPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());

  async function carregarAtendimentos() {
    try {
      const response = await api("/atendimentos");
      const data = await response.json();

      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  const eventos = useMemo<CalendarEvent[]>(() => {
    return atendimentos.map((atendimento) => {
      const inicio = new Date(atendimento.data);

      const duracaoTotal =
        atendimento.procedimentos.reduce(
          (total, item) => total + Number(item.procedimento.duracao ?? 0),
          0
        ) || 60;

      const fim = new Date(inicio.getTime() + duracaoTotal * 60000);

      return {
        id: atendimento.id,
        title: `${atendimento.cliente?.nome ?? "Cliente"} • ${
          atendimento.profissional?.nome ?? "Barbeiro"
        }`,
        start: inicio,
        end: fim,
        resource: atendimento,
      };
    });
  }, [atendimentos]);

  useEffect(() => {
    carregarAtendimentos();
  }, []);

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <span>CALENDÁRIO OPERACIONAL</span>

        <h1>Calendário da barbearia</h1>

        <p>
          Visualize os atendimentos em formato semanal, com duração real,
          barbeiro, cliente e status operacional.
        </p>
      </section>

      <section className={styles.calendarCard}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          views={["month", "week", "day", "agenda"]}
          culture="pt-br"
          min={new Date(2026, 0, 1, 8, 0)}
          max={new Date(2026, 0, 1, 22, 0)}
          messages={{
            today: "Hoje",
            previous: "Voltar",
            next: "Próximo",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Atendimento",
            noEventsInRange: "Nenhum atendimento neste período.",
          }}
          eventPropGetter={(event) => {
            const status = event.resource.status;

            if (status === "CANCELADO") {
              return { className: styles.canceladoEvento };
            }

            if (status === "REALIZADO") {
              return { className: styles.realizadoEvento };
            }

            if (status === "CONFIRMADO") {
              return { className: styles.confirmadoEvento };
            }

            return { className: styles.pendenteEvento };
          }}
          components={{
            event: ({ event }) => {
              const atendimento = event.resource;

              return (
                <div className={styles.eventContent}>
                  <strong>{atendimento.cliente?.nome}</strong>
                  <span>{atendimento.profissional?.nome}</span>
                </div>
              );
            },
          }}
        />
      </section>
    </main>
  );
}