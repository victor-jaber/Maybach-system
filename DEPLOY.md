# Deploy no Coolify

## Requisitos

- Docker
- PostgreSQL database

## Variáveis de Ambiente

Configure as seguintes variáveis no Coolify:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=sua-chave-secreta-aqui
NODE_ENV=production

# Opcional - para o seed do admin
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=sua-senha-segura
ADMIN_NAME=Administrador
```

## Build e Deploy

O Dockerfile está configurado para:
1. Fazer build da aplicação com Node.js 20
2. Criar uma imagem de produção otimizada
3. Expor a porta 5000

## Primeiro Deploy - Passo a Passo

### 1. Criar as tabelas do banco de dados

Após o deploy, acesse o terminal do container e execute:

```bash
npx drizzle-kit push
```

### 2. Criar usuário administrador

Depois de criar as tabelas, execute o seed:

```bash
npx tsx scripts/seed-admin.ts
```

### Credenciais Padrão

Se não configurar as variáveis de ambiente do admin, as credenciais padrão serão:
- Email: `admin@maybach.com`
- Senha: `admin123`

**IMPORTANTE: Altere a senha após o primeiro login!**

## Comandos Docker

### Acessar o terminal do container:
```bash
docker exec -it <container_id> sh
```

### Executar comandos diretamente:
```bash
docker exec -it <container_id> npx drizzle-kit push
docker exec -it <container_id> npx tsx scripts/seed-admin.ts
```

## Healthcheck

A aplicação responde em `http://localhost:5000`

## Troubleshooting

### Erro "Cannot find module 'drizzle-kit'"
O arquivo `drizzle.config.json` foi criado para evitar problemas de importação. Certifique-se de fazer um novo build da imagem.

### Erro de conexão com banco
Verifique se a variável `DATABASE_URL` está configurada corretamente e se o banco está acessível a partir do container.
