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

## Criar Usuário Administrador

Após o primeiro deploy, execute o seed para criar o usuário administrador:

### Opção 1: Via Coolify Terminal

```bash
npx tsx scripts/seed-admin.ts
```

### Opção 2: Docker exec

```bash
docker exec -it <container_id> npx tsx scripts/seed-admin.ts
```

### Credenciais Padrão

Se não configurar as variáveis de ambiente do admin, as credenciais padrão serão:
- Email: `admin@maybach.com`
- Senha: `admin123`

**IMPORTANTE: Altere a senha após o primeiro login!**

## Migrações do Banco

Antes de rodar o seed, certifique-se de que as tabelas estão criadas:

```bash
npx drizzle-kit push
```

## Healthcheck

A aplicação responde em `http://localhost:5000`
