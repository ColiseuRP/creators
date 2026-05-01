# Creators Coliseu

Painel operacional para creators, admins e responsáveis, preparado para deploy na Vercel com:

- Next.js 16 + TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage privado para prints das métricas
- API Routes seguras para reviews, avisos e Discord
- Bot Discord separado para automações em tempo real
- Fallback mockado para desenvolvimento quando o Supabase ainda não estiver configurado

## Estrutura principal

- `src/app`: páginas App Router, layouts e API routes
- `src/components`: shell, cards, tabelas e formulários
- `src/lib`: auth, sessão, Supabase, workflows e integrações do painel
- `src/bot`: processo separado do bot Discord
- `src/shared`: helpers compartilhados entre painel e bot
- `supabase/migrations/202604301900_initial_schema.sql`: schema principal, bucket e RLS base
- `supabase/migrations/202605011020_discord_log_pending_enum.sql`: adiciona o status `pending` ao enum de logs do Discord
- `supabase/migrations/202605011030_notice_discord_delivery.sql`: adiciona rastreamento detalhado dos avisos enviados ao Discord
- `supabase/migrations/202605011130_discord_bot_tickets.sql`: adiciona tickets, painéis e logs do bot
- `supabase/seeds/initial_admin.sql`: seed do primeiro administrador
- `.env.example`: variáveis de ambiente esperadas

## 1. Como criar o projeto no Supabase

1. Acesse [Supabase](https://supabase.com/) e crie um novo projeto.
2. Copie a `Project URL` e a `anon public key` em `Project Settings > API`.
3. Copie também a `service_role key`. Ela será usada apenas no backend.
4. Em `Authentication > Providers`, mantenha `Email` habilitado para login por e-mail e senha.

## 2. Como configurar as tabelas

No `SQL Editor` do Supabase, execute as migrations nesta ordem:

1. `supabase/migrations/202604301900_initial_schema.sql`
2. `supabase/migrations/202605011020_discord_log_pending_enum.sql`
3. `supabase/migrations/202605011030_notice_discord_delivery.sql`
4. `supabase/migrations/202605011130_discord_bot_tickets.sql`

As migrations criam:

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
- `creator_tickets`
- `discord_panels`
- `discord_bot_logs`

Também são criados:

- enums de status e papéis
- trigger para criar `profiles` a partir de `auth.users`
- trigger para criar a sala padrão em `creator_rooms`
- índices para consultas frequentes
- políticas de Row Level Security

## 3. Como configurar as policies RLS

As policies já estão dentro das migrations SQL. Depois de executar os arquivos, confirme no Supabase:

- `profiles`: usuário vê o próprio perfil; staff vê tudo.
- `creators`: creator vê apenas o próprio cadastro; staff gerencia todos.
- `creator_rooms`: creator vê apenas a própria sala; staff gerencia todas.
- `metric_submissions`: creator vê e envia apenas a própria métrica; staff revisa tudo.
- `metric_attachments`: creator vê e anexa arquivos apenas às próprias métricas; staff acessa tudo.
- `creator_notices`: creator vê avisos gerais, por categoria e individuais; staff cria e visualiza tudo.
- `metric_reviews`: creator vê a análise das próprias métricas; staff registra reviews.
- `discord_settings`: staff visualiza; admin geral pode alterar.
- `discord_message_logs`: staff acompanha o resultado dos envios ao Discord.
- `creator_tickets`: staff acompanha e gerencia tickets; creator autenticado pode ver apenas o próprio ticket.
- `discord_panels`: staff visualiza e gerencia os painéis do Discord.
- `discord_bot_logs`: staff acompanha os eventos automáticos do bot.

## 4. Como criar o bucket de uploads

O bucket também é criado na migration principal com estas regras:

- nome: `metric-attachments`
- privado (`public = false`)
- tipos aceitos: `PNG`, `JPG`, `JPEG`, `WEBP`
- limite por arquivo: `5MB`
- pasta do creator: `creator_id/arquivo.ext`

As policies de `storage.objects` garantem que:

- creator só insere e lê arquivos na própria pasta
- admin e responsável creators podem visualizar e administrar anexos

No frontend, o preview é local e acontece antes do upload real.

## 5. Variáveis de ambiente

Preencha as variáveis abaixo com base em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CITIZEN_ROLE_ID=
DISCORD_CREATORS_CATEGORY_ID=
DISCORD_ARCHIVED_TICKETS_CATEGORY_ID=
DISCORD_STAFF_ROLE_IDS=
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

Finalidade das variáveis do Discord:

- `DISCORD_GUILD_ID`: servidor principal do Coliseu RP.
- `DISCORD_CITIZEN_ROLE_ID`: cargo automático de Cidadão para novos membros.
- `DISCORD_CREATORS_CATEGORY_ID`: categoria onde os tickets privados dos creators são criados.
- `DISCORD_ARCHIVED_TICKETS_CATEGORY_ID`: categoria opcional para arquivar tickets fechados.
- `DISCORD_STAFF_ROLE_IDS`: lista separada por vírgula com os cargos da staff que podem ver e responder tickets.
- `DISCORD_GENERAL_CREATORS_CHANNEL_ID`: compatibilidade com a estrutura antiga de avisos gerais.
- `DISCORD_RULES_CHANNEL_ID`: canal das regras gerais do programa.
- `DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID`: canal dos requisitos oficiais dos Influencers Coliseu.
- `DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID`: canal dos requisitos oficiais do Programa de Streamers Coliseu.
- `DISCORD_TICKET_CHANNEL_ID`: canal que recebe o painel com o botão de criação de ticket.
- `DISCORD_PUNISHMENTS_CHANNEL_ID`: canal para advertências, punições e remoções.
- `DISCORD_NOTICES_CHANNEL_ID`: canal principal de avisos gerais dos creators.
- `DISCORD_LOGOS_CHANNEL_ID`: canal de logos, artes e materiais visuais.

Observações:

- Quando `DISCORD_GENERAL_CREATORS_CHANNEL_ID` não estiver preenchido, o sistema usa `DISCORD_NOTICES_CHANNEL_ID` como fallback para avisos gerais.
- O painel de tickets e os tickets privados usam Supabase em produção. Se o banco ainda não estiver configurado, existe fallback em memória apenas para desenvolvimento.

## 6. Como configurar as variáveis na Vercel

1. Abra o projeto na Vercel.
2. Vá em `Settings > Environment Variables`.
3. Cadastre todas as variáveis para `Production`, `Preview` e, se quiser, `Development`.
4. Depois de alterar qualquer variável, faça um novo deploy para aplicar o ambiente atualizado.

## 7. Como rodar o projeto localmente

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env.local
```

3. Preencha as variáveis do Supabase e Discord.
4. Rode o site:

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

## 8. Bot Discord separado do site

O site na Vercel continua responsável por:

- painel administrativo
- login
- métricas
- avisos
- publicação do painel de tickets

O bot Discord roda separado, em um processo online 24h, para suportar:

- auto cargo ao entrar no servidor
- abertura e fechamento de tickets
- interações com botões
- eventos em tempo real do Discord

### Onde hospedar o bot

Hospede o bot em um serviço com processo persistente, como:

- Railway
- Render
- Fly.io
- VPS
- outro serviço 24/7

Importante:

- a Vercel não deve ser usada para manter o bot online por WebSocket
- a Vercel pode publicar o painel e fazer chamadas administrativas
- o bot em si deve rodar separado

### Scripts do projeto

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run bot:dev
npm run bot:start
```

## 9. Como publicar o painel de tickets

Existem duas formas operacionais:

1. No painel admin, na área `Tickets Discord`, clique em `Publicar painel de tickets`.
2. Pela rota segura:

```http
POST /api/discord/setup-tickets
```

Essa rotina:

- publica a mensagem no `DISCORD_TICKET_CHANNEL_ID`
- inclui o botão `Criar sala creator`
- salva o `message_id` em `discord_panels`
- atualiza a mesma mensagem quando já existir um painel salvo

## 10. Sistema de tickets

Ao clicar no botão do painel:

- o bot verifica se o usuário já possui ticket aberto
- se já existir, responde com a sala já aberta
- se não existir, cria um canal privado na categoria de creators
- libera acesso para:
  - o usuário que abriu
  - os cargos configurados em `DISCORD_STAFF_ROLE_IDS`
  - o bot

Ao fechar:

- staff e administradores podem fechar
- o próprio criador também pode solicitar o fechamento
- o canal é movido para `DISCORD_ARCHIVED_TICKETS_CATEGORY_ID`, se existir
- se não existir categoria de arquivados, o canal é removido após alguns segundos

## 11. Auto cargo ao entrar no servidor

Quando um novo membro entra no Discord:

- o bot escuta o evento de entrada
- busca o cargo definido em `DISCORD_CITIZEN_ROLE_ID`
- adiciona automaticamente o cargo Cidadão
- registra sucesso ou falha em `discord_bot_logs`
- em caso de erro, continua online sem derrubar o processo

## 12. Permissões necessárias do bot

O bot precisa destas permissões no servidor:

- View Channels
- Send Messages
- Read Message History
- Manage Channels
- Manage Roles
- Embed Links
- Attach Files
- Use Application Commands

Também é necessário:

- o cargo do bot estar acima do cargo Cidadão
- o cargo do bot estar acima dos cargos que ele vai gerenciar
- o bot conseguir ver e enviar mensagens no canal de tickets
- o bot conseguir criar canais dentro da categoria de creators

## 13. Discord Developer Portal

No Discord Developer Portal:

1. Abra a aplicação do bot.
2. Vá em `Bot`.
3. Ative `Privileged Gateway Intents`.
4. Ative `Server Members Intent / Guild Members Intent`.
5. Salve.

Isso é necessário para o evento de entrada de novos membros funcionar.

## 14. Como preparar o primeiro administrador

1. No `Authentication > Users` do Supabase, crie o usuário com o e-mail `diretorsnow@coliseurp.br`.
2. Defina a senha diretamente no Supabase Auth. Não existe senha fixa no código.
3. Depois de criar o usuário, execute o script `supabase/seeds/initial_admin.sql`.
4. O script promove o perfil para `admin_general`, que é o papel interno equivalente ao Admin Geral da interface.
5. Após isso, o login desse usuário será direcionado para a Central de Creators.

## 15. Auth, backend e segurança

- login: Supabase Auth com e-mail e senha
- perfis:
  - `admin_general`
  - `responsavel_creators`
  - `creator`
- sessão do usuário comum usa a chave pública (`anon key`) via Supabase SSR
- operações privilegiadas usam `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor
- integração com Discord acontece exclusivamente no backend ou no processo separado do bot
- IDs de canais e cargos do Discord ficam apenas no ambiente do servidor
- após o login, o sistema valida o `profile` do usuário antes de liberar a área correta

## 16. API Routes criadas

- `POST /api/metrics/submit`
- `POST /api/storage/metric-attachments`
- `POST /api/metrics/[id]/approve`
- `POST /api/metrics/[id]/deny`
- `POST /api/notices/individual`
- `POST /api/notices/general`
- `POST /api/notices/[id]/resend`
- `POST /api/discord/send`
- `POST /api/discord/setup-tickets`

## 17. Fluxo de aprovação e negação de métricas

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

## 18. Como fazer deploy na Vercel

1. Suba o repositório para o GitHub.
2. Na [Vercel](https://vercel.com/), clique em `Add New Project`.
3. Importe o repositório.
4. Configure as variáveis de ambiente listadas acima.
5. Garanta que todas as migrations do Supabase já tenham sido executadas.
6. Faça o deploy.

Não é necessário `vercel.json` extra para este caso; o projeto já usa o fluxo padrão de Next.js compatível com a Vercel.
