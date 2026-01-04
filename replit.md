# MayBack Cars - Sistema de Gestão para Concessionárias

## Overview
Sistema web completo para administração de lojas de veículos, desenvolvido com React, Express e PostgreSQL. Inclui área pública para catálogo de veículos e área administrativa para gestão completa de estoque, clientes, vendas, contratos e consulta de débitos.

## Current State
O sistema está funcional com as seguintes funcionalidades:
- Área pública de catálogo de veículos com filtros
- Sistema de login com autenticação JWT
- Dashboard administrativo com estatísticas
- CRUD completo de veículos com dados brasileiros (Renavam, Placa, Chassi)
- CRUD completo de clientes com informações detalhadas (CPF/CNPJ, RG, CNH, profissão, renda)
- Registro de vendas com suporte a pagamento à vista e financiado
- Gestão de marcas e categorias de veículos
- Módulo de contratos com geração de PDF profissional
- Relatórios e dashboards com gráficos interativos
- Consulta de débitos veiculares (IPVA, multas, licenciamento)

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
- `users` - Usuários do sistema
- `brands` - Marcas de veículos
- `categories` - Categorias de veículos
- `vehicles` - Cadastro de veículos
- `vehicle_images` - Imagens dos veículos
- `customers` - Cadastro de clientes
- `sales` - Registro de vendas
- `contracts` - Contratos de venda/entrada
- `contract_installments` - Parcelas de contratos
- `contract_files` - PDFs gerados dos contratos
- `vehicle_debts` - Débitos veiculares (IPVA, multas, licenciamento)
- `stores` - Configurações da loja

## Key Files
- `client/src/App.tsx` - Rotas e layout principal
- `client/src/pages/` - Páginas da aplicação
- `server/routes.ts` - Endpoints da API
- `server/storage.ts` - Operações de banco de dados
- `shared/schema.ts` - Modelos de dados

## Running the Project
O projeto usa o workflow "Start application" que executa `npm run dev` para iniciar o servidor Express com Vite.

## Recent Changes
- 04/01/2026: Correção de Contratos - Sincronização com Vendas
  - Corrigido cálculo de entrada total (entrada + valor de troca)
  - Corrigido valor restante (valor da venda - entrada total)
  - Adicionados campos de financiamento no contrato (banco, parcelas)
  - Veículo de troca agora aparece corretamente no contrato
  - Página de contratos exibe todos os valores: venda, entrada, restante, troca
  - PDF usa endpoint POST `/api/contracts/:id/generate-pdf`

- 29/12/2024: Enhanced Sales Page with Inline Creation & Auto-Contracts
  - Added inline customer creation popup with quick registration (name, CPF/CNPJ, phone, email)
  - Added inline vehicle creation popup for both sale vehicles and trade-in vehicles
  - Trade-in vehicles are automatically marked as "reserved" for evaluation
  - Improved sale form with down payment, remaining value auto-calculation
  - Multiple payment methods: cash, PIX, boleto, credit card, financing
  - Automatic contract creation when a sale is registered
  - Stock tab with vehicle costs management and profit calculation summary
  - Contracts page converted to view-only (no manual creation)
  - Contracts are now created automatically from sales
  - Currency values properly converted to numbers before API calls

- 26/12/2024: Electronic Signature PDF Auto-Generation & Email
  - Store signature pre-applied when generating contract PDFs
  - After customer signs, PDF regenerated with both signatures embedded
  - Signed contract automatically emailed to customer as attachment
  - Digital signature certificate attestation added to PDF (MP 2.200-2/2001)
  - `generateSignedPdfBuffer` helper function for signed PDF generation
  - `sendSignedContractEmail` function for sending signed contracts

- 26/12/2024: Electronic Signature Security Hardening
  - Added invalidated status check to all public signature routes
  - Tokens are automatically invalidated when new signature requests are sent
  - CPF/CNPJ validation required before sending signature emails
  - 5-attempt limit for validation codes with automatic lockout
  - IP address tracking for validation and signing actions
  - Token expiration enforced (48 hours)

- 26/12/2024: Electronic Signature Feature Complete
  - Added contract_signatures table for tracking signature requests
  - Implemented email service with SMTP configuration
  - Created public signature page with multi-step flow
  - Identity verification using last 3 CPF digits or first 3 CNPJ digits
  - Contract review with PDF display before signing
  - Signature button integrated into contracts management page

- 24/12/2024: Consulta de Débitos Veiculares
  - Adicionada tabela vehicle_debts para armazenar débitos
  - Implementada consulta de IPVA, multas, licenciamento e seguro
  - Criada página para visualizar e gerenciar débitos por veículo
  - Suporte para marcar débitos como pagos

- 24/12/2024: Relatórios e Dashboard
  - Implementado módulo de relatórios com gráficos interativos
  - Vendas por período, marca, categoria
  - Análise de margem de lucro por venda
  - Filtros por período (7 dias a 1 ano)

- 23/12/2024: Implementação inicial do sistema completo
  - Criado schema de dados para veículos, clientes e vendas
  - Implementadas todas as páginas administrativas
  - Configurado sistema de autenticação JWT
  - Criado catálogo público de veículos
  - Módulo de contratos com geração de PDF

## User Preferences
- Idioma: Português (Brasil)
- Moeda: Real (BRL)
- Formato de data: DD/MM/YYYY
- Documentos: CPF, CNPJ, RG, CNH, Renavam
