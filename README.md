# Creators Hub

Painel operacional para creators, admins e responsáveis, pronto para deploy na Vercel com:

- Next.js 16 + TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage privado para prints das métricas
- API Routes seguras para reviews, avisos e Discord
- Fallback mockado para desenvolvimento quando o Supabase ainda não estiver configurado

## Estrutura principal

- [src/app](/C:/Users/Dev%20Snow/Documents/New%20project%203/src/app): páginas App Router, layouts e API routes
- [src/components](/C:/Users/Dev%20Snow/Documents/New%20project%203/src/components): shell, cards e formulários
- [src/lib](/C:/Users/Dev%20Snow/Documents/New%20project%203/src/lib): auth, sessão, Supabase, workflows e validações
- [supabase/migrations/202604301900_initial_schema.sql](/C:/Users/Dev%20Snow/Documents/New%20project%203/supabase/migrations/202604301900_initial_schema.sql): schema, triggers, bucket e policies RLS
- [.env.example](/C:/Users/Dev%20Snow/Documents/New%20project%203/.env.example): variáveis de ambiente esperadas

## 1. Como criar o projeto no Supabase

1. Acesse [Supabase](https://supabase.com/) e crie um novo projeto.
2. Copie a `Project URL` e a `anon public key` em `Project Settings > API`.
3. Copie também a `service_role key`. Ela será usada apenas no backend.
4. Em `Authentication > Providers`, mantenha `Email` habilitado para login por email/senha.

## 2. Como configurar as tabelas

1. No projeto Supabase, abra `SQL Editor`.
2. Execute a migration em [supabase/migrations/202604301900_initial_schema.sql](/C:/Users/Dev%20Snow/Documents/New%20project%203/supabase/migrations/202604301900_initial_schema.sql).
3. A migration cria:
   - `profiles`
   - `creators`
   - `creator_rooms`
   - `creator_applications`
   - `metric_submissions`
   - `metric_attachments`
   - `metric_reviews`
   - `creator_notices`
   - `discord_settings`
   - `discord_message_logs`
4. A migration também cria:
   - enums de status e papéis
   - trigger para criar `profiles` a partir de `auth.users`
   - trigger para criar a sala padrão em `creator_rooms` quando um creator é cadastrado
   - índices para consultas frequentes

## 3. Como configurar as policies RLS

As policies já estão dentro da migration SQL. Depois de executar o arquivo, confirme em `Authentication > Policies` ou no Table Editor que:

- `profiles`: usuário vê o próprio perfil; staff vê tudo.
- `creators`: creator vê apenas o próprio cadastro; staff gerencia todos.
- `creator_rooms`: creator vê apenas a própria sala; staff gerencia todas.
- `metric_submissions`: creator vê e envia apenas a própria métrica; staff revisa tudo.
- `metric_attachments`: creator vê e anexa arquivos apenas às próprias métricas; staff acessa tudo.
- `creator_notices`: creator vê avisos gerais, por categoria e individuais; staff cria e visualiza tudo.
- `metric_reviews`: creator vê a análise das próprias métricas; staff registra reviews.
- `discord_settings`: staff visualiza; admin geral pode alterar.
- `discord_message_logs`: staff acompanha o resultado dos envios ao Discord.

## 4. Como criar o bucket de uploads

O bucket também é criado na migration com estas regras:

- Nome: `metric-attachments`
- Privado (`public = false`)
- Tipos aceitos: `PNG`, `JPG`, `JPEG`, `WEBP`
- Limite por arquivo: `5MB`
- Pasta do creator: `creator_id/arquivo.ext`

As policies de `storage.objects` garantem que:

- creator só insere e lê arquivos na própria pasta
- admin e responsável creators podem visualizar e administrar anexos

No frontend, o preview é local e acontece antes do upload real.

## 5. Como configurar as variáveis de ambiente na Vercel

Crie as variáveis abaixo com base em [.env.example](/C:/Users/Dev%20Snow/Documents/New%20project%203/.env.example):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CREATORS_CATEGORY_ID=
DISCORD_GENERAL_CREATORS_CHANNEL_ID=
DISCORD_RULES_CHANNEL_ID=
DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID=
DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID=
DISCORD_TICKET_CHANNEL_ID=
DISCORD_PUNISHMENTS_CHANNEL_ID=
DISCORD_NOTICES_CHANNEL_ID=
DISCORD_LOGOS_CHANNEL_ID=
```

Regras importantes:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser usadas no frontend.
- `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no backend.
- `DISCORD_BOT_TOKEN` deve existir apenas no backend.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `DISCORD_BOT_TOKEN` no navegador.

Variáveis do Discord:

- `DISCORD_GUILD_ID`: ID do servidor principal do Discord.
- `DISCORD_CREATORS_CATEGORY_ID`: categoria onde ficam as salas dos creators.
- `DISCORD_GENERAL_CREATORS_CHANNEL_ID`: compatibilidade com a configuração antiga de avisos gerais.
- `DISCORD_RULES_CHANNEL_ID`: canal destinado às regras gerais do programa.
- `DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID`: canal com os requisitos oficiais dos Influencers Coliseu.
- `DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID`: canal com os requisitos oficiais do Programa de Streamers Coliseu.
- `DISCORD_TICKET_CHANNEL_ID`: canal usado para orientar abertura de ticket e suporte.
- `DISCORD_PUNISHMENTS_CHANNEL_ID`: canal para advertências, punições e remoções do programa.
- `DISCORD_NOTICES_CHANNEL_ID`: canal principal de avisos gerais dos creators.
- `DISCORD_LOGOS_CHANNEL_ID`: canal para logos, artes e materiais visuais.

Observação:

- Quando `DISCORD_GENERAL_CREATORS_CHANNEL_ID` não estiver preenchido, o sistema usa `DISCORD_NOTICES_CHANNEL_ID` como fallback para avisos gerais.

Na Vercel:

1. Abra o projeto.
2. Vá em `Settings > Environment Variables`.
3. Cadastre todas as variáveis acima para `Production`, `Preview` e, se quiser, `Development`.

## 6. Como rodar o projeto localmente

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Preencha as variáveis do Supabase e Discord.
4. Rode o projeto:

```bash
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000).

### Modo mock para desenvolvimento

Se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem configuradas, o app entra em modo demo automaticamente em ambiente local. Nesse modo:

- o login real é substituído por botões de perfis demo
- dados aparecem mockados
- nenhuma alteração real é persistida

Esse fallback existe só para desenvolvimento. Em produção, o deploy deve usar o Supabase configurado.

## 7. Como fazer deploy na Vercel

1. Suba o repositório para GitHub.
2. Na [Vercel](https://vercel.com/), clique em `Add New Project`.
3. Importe o repositório.
4. Configure as variáveis de ambiente listadas acima.
5. Garanta que a migration do Supabase já tenha sido executada.
6. Faça o deploy.

Não é necessário `vercel.json` extra para este caso; o projeto já usa o fluxo padrão de Next.js compatível com a Vercel.

## Auth, backend e segurança

- Login: Supabase Auth com email/senha.
- Perfis:
  - `admin_general`
  - `responsavel_creators`
  - `creator`
- Sessão do usuário comum usa a chave pública (`anon key`) via Supabase SSR.
- Operações privilegiadas usam `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor.
- Integração com Discord acontece exclusivamente no backend.
- Os IDs de canais do Discord ficam apenas no ambiente do servidor e são resolvidos por finalidade antes de cada envio.

## API Routes criadas

- `POST /api/metrics/submit`
- `POST /api/storage/metric-attachments`
- `POST /api/metrics/[id]/approve`
- `POST /api/metrics/[id]/deny`
- `POST /api/notices/individual`
- `POST /api/notices/general`
- `POST /api/discord/send`

## Fluxo de aprovação e negação de métricas

Quando uma métrica é aprovada ou negada:

1. O status é salvo em `metric_submissions`.
2. O review é registrado em `metric_reviews`.
3. Um aviso interno é criado em `creator_notices`.
4. O backend tenta enviar mensagem no canal individual do creator no Discord.
5. O resultado é salvo em `discord_message_logs`.

Se o Discord falhar:

- a aprovação ou negação continua salva no Supabase
- o erro é registrado em `discord_message_logs`
- o painel continua mostrando o resultado principal e o status do Discord separadamente

## Observações de operação

- Para onboarding real, crie o usuário em `Auth`, confirme o `profile` em `profiles` e associe o creator em `creators`.
- O trigger em `creators` cria automaticamente uma sala em `creator_rooms`.
- O bucket é privado; para visualização, o app gera signed URLs com sessão autenticada.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
# creatorscoliseu
# creators
