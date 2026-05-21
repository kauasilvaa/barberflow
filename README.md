# 💈 BarberFlow

Sistema Full Stack para gestão de barbearias desenvolvido com foco em organização operacional, controle de atendimentos e experiência do usuário.

## Funcionalidades

### Autenticação

- Login de usuários
- Cadastro de conta
- Recuperação de senha por e-mail
- Redefinição de senha via token
- Controle de acesso por perfil (Administrador e Cliente)

### Gestão de Clientes

- Cadastro de clientes
- Listagem de clientes
- Vinculação automática do cliente ao usuário cadastrado

### Gestão de Barbeiros

- Cadastro de barbeiros
- Controle de profissionais ativos

### Gestão de Serviços

- Cadastro de serviços
- Definição de categoria
- Controle de duração
- Controle de preço
- Ativação e desativação de serviços

### Agendamentos

- Criação de agendamentos
- Associação de cliente, barbeiro e serviços
- Controle de status:
  - PENDENTE
  - CONFIRMADO
  - REALIZADO
  - CANCELADO

### Dashboard

- Total de clientes
- Total de atendimentos
- Atendimentos por status
- Faturamento previsto
- Faturamento realizado
- Indicadores operacionais

### Agenda

- Agenda diária
- Timeline operacional
- Filtros por data
- Filtros por status

---

## Tecnologias Utilizadas

### Frontend

- Next.js
- React
- TypeScript
- CSS Modules
- Lucide React

### Backend

- Node.js
- Fastify
- Prisma ORM
- JWT
- Bcrypt
- Nodemailer

### Banco de Dados

- PostgreSQL
- Neon Database

---

## Como Executar

### Backend

```bash
cd backend
npm install
```

Criar o arquivo `.env`:

```env
DATABASE_URL=
JWT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
FRONTEND_URL=http://localhost:3000
```

Executar:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Backend disponível em:

```txt
http://localhost:3333
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em:

```txt
http://localhost:3000
```

---

## Estrutura do Projeto

```txt
barberflow/
├── backend/
├── frontend/
└── README.md
```

---

## Objetivo

O BarberFlow foi desenvolvido para consolidar conhecimentos em desenvolvimento Full Stack, autenticação JWT, integração entre frontend e backend, banco de dados relacional e construção de sistemas de gestão para negócios reais.

---

## Desenvolvedor

Kauã Aparecido da Silva

GitHub:
https://github.com/kauasilvaa