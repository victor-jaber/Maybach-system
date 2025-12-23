# AutoGestão - Sistema de Gestão para Concessionárias

## Overview
Sistema web completo para administração de lojas de veículos, desenvolvido com React, Express e PostgreSQL. Inclui área pública para catálogo de veículos e área administrativa para gestão completa de estoque, clientes e vendas.

## Current State
O sistema está funcional com as seguintes funcionalidades:
- Área pública de catálogo de veículos com filtros
- Sistema de login via Replit Auth
- Dashboard administrativo com estatísticas
- CRUD completo de veículos com dados brasileiros (Renavam, Placa, Chassi)
- CRUD completo de clientes com informações detalhadas (CPF/CNPJ, RG, CNH, profissão, renda)
- Registro de vendas com suporte a pagamento à vista e financiado
- Gestão de marcas e categorias de veículos

## Project Architecture

### Frontend (client/)
- **Framework**: React com TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS + Shadcn UI
- **Forms**: React Hook Form + Zod

### Backend (server/)
- **Framework**: Express.js
- **Authentication**: Replit Auth (OpenID Connect)
- **Database**: PostgreSQL com Drizzle ORM

### Database Schema (shared/schema.ts)
- `users` - Usuários do sistema (via Replit Auth)
- `sessions` - Sessões de autenticação
- `brands` - Marcas de veículos
- `categories` - Categorias de veículos
- `vehicles` - Cadastro de veículos
- `customers` - Cadastro de clientes
- `sales` - Registro de vendas

## Key Files
- `client/src/App.tsx` - Rotas e layout principal
- `client/src/pages/` - Páginas da aplicação
- `server/routes.ts` - Endpoints da API
- `server/storage.ts` - Operações de banco de dados
- `shared/schema.ts` - Modelos de dados

## Running the Project
O projeto usa o workflow "Start application" que executa `npm run dev` para iniciar o servidor Express com Vite.

## Recent Changes
- 23/12/2024: Implementação inicial do sistema completo
  - Criado schema de dados para veículos, clientes e vendas
  - Implementadas todas as páginas administrativas
  - Configurado sistema de autenticação via Replit Auth
  - Criado catálogo público de veículos

## User Preferences
- Idioma: Português (Brasil)
- Moeda: Real (BRL)
- Formato de data: DD/MM/YYYY
- Documentos: CPF, CNPJ, RG, CNH, Renavam
