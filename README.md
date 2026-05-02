# Creators Coliseu

Painel operacional do programa Creators Coliseu, com site em Next.js e bot do Discord rodando como processo separado.

## Stack

- Next.js 16 com TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Discord integrado por backend e bot dedicado
- Deploy do site preparado para Vercel

## Estrutura principal

- `src/app`: páginas, layouts e route handlers do site
- `src/components`: componentes de interface e formulários
- `src/lib`: autenticação, sessões, workflows, integrações e utilitários
- `src/bot`: entrypoint, eventos, interações, serviços e utilitários do bot Discord
- `src/shared`: helpers compartilhados entre site e bot
- `supabase/migrations`: schema e evoluções do banco
- `supabase/seeds`: seeds auxiliares, incluindo o primeiro administrador
- `.env.example`: variáveis de ambiente esperadas

## Variáveis de ambiente

Use este conjunto no ambiente local e nos serviços de deploy:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CITIZEN_ROLE_ID=1447948745718239476
DISCORD_CREATORS_CATEGORY_ID=1447948746985046028
DISCORD_ARCHIVED_TICKETS_CATEGORY_ID=
DISCORD_RESPONSAVEL_STAFF_ROLE_ID=1447948745827156051
DISCORD_RESPONSAVEL_CREATORS_ROLE_ID=
DISCORD_STAFF_ROLE_IDS=

DISCORD_GENERAL_CREATORS_CHANNEL_ID=1447948746985046029
DISCORD_RULES_CHANNEL_ID=
DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID=
DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID=
DISCORD_TICKET_CHANNEL_ID=1447948746670477469
DISCORD_CREATOR_FORM_CHANNEL_ID=1499941154966212688
DISCORD_CREATOR_FORM_SUBMISSIONS_CHANNEL_ID=1499941324143460466
DISCORD_APPROVED_CREATOR_ROLE_ID=1447948745718239475
DISCORD_PUNISHMENTS_CHANNEL_ID=
DISCORD_NOTICES_CHANNEL_ID=1447948746985046029
DISCORD_LOGOS_CHANNEL_ID=
```

Regras importantes:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem ser usados no frontend.
- `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no backend e no processo do bot.
- `DISCORD_BOT_TOKEN` deve existir apenas no backend e no processo do bot.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `DISCORD_BOT_TOKEN` no navegador.
- `DISCORD_RESPONSAVEL_STAFF_ROLE_ID` define o cargo principal que será marcado nos tickets.
- `DISCORD_RESPONSAVEL_CREATORS_ROLE_ID` é opcional e pode liberar outro cargo oficial da equipe.
- `DISCORD_STAFF_ROLE_IDS` aceita múltiplos IDs separados por vírgula.
- `DISCORD_CREATOR_FORM_CHANNEL_ID` define o canal onde o bot publica o painel oficial do formulário.
- `DISCORD_CREATOR_FORM_SUBMISSIONS_CHANNEL_ID` define o canal onde a equipe recebe as inscrições vindas do Discord.
- `DISCORD_APPROVED_CREATOR_ROLE_ID` é o cargo entregue automaticamente quando a inscrição é aprovada.
- `DISCORD_ARCHIVED_TICKETS_CATEGORY_ID` é opcional. Se não estiver preenchida, tickets fechados são removidos em vez de arquivados.
- Se `DISCORD_GENERAL_CREATORS_CHANNEL_ID` não estiver configurado, o sistema usa `DISCORD_NOTICES_CHANNEL_ID` como fallback de compatibilidade.

## Como criar o projeto no Supabase

1. Acesse [Supabase](https://supabase.com/) e crie um novo projeto.
2. Copie a `Project URL` e a `anon public key` em `Project Settings > API`.
3. Copie a `service_role key`. Ela será usada apenas no backend e no bot.
4. Em `Authentication > Providers`, mantenha `Email` habilitado para login por e-mail e senha.

## Como configurar as tabelas e migrations

No `SQL Editor` do Supabase, execute os arquivos nesta ordem:

1. `supabase/migrations/202604301900_initial_schema.sql`
2. `supabase/migrations/202605011020_discord_log_pending_enum.sql`
3. `supabase/migrations/202605011030_notice_discord_delivery.sql`
4. `supabase/migrations/202605011130_discord_bot_tickets.sql`
5. `supabase/migrations/202605011340_bootstrap_discord_bot_tables.sql`
6. `supabase/migrations/202605011430_ticket_type_support.sql`
7. `supabase/migrations/202605011530_creator_application_discord_flow.sql`

As migrations cobrem:

- perfis, creators, inscrições, salas e métricas
- anexos e reviews de métricas
- avisos internos
- configurações e logs do Discord
- tickets do Discord
- painéis publicados pelo bot
- logs próprios do bot

### Tabelas adicionais do bot

`202605011130_discord_bot_tickets.sql` cria:

- `creator_tickets`
- `discord_panels`
- `discord_bot_logs`

Se a produção estiver mostrando erros como `Could not find the table 'public.creator_tickets' in the schema cache`, aplique também `202605011340_bootstrap_discord_bot_tables.sql` no Supabase para criar as tabelas ausentes e atualizar a estrutura esperada pelo site.

Para liberar o filtro por tipo de atendimento, a gravação de `ticket_type` e os campos novos de log do bot, aplique também `202605011430_ticket_type_support.sql`.

Para liberar a aprovação e negação de inscrições pelo site e pelo Discord, além do formulário oficial do bot, aplique também `202605011530_creator_application_discord_flow.sql`.

Também cria:

- enum `creator_ticket_status`
- índice único para impedir mais de um ticket aberto por usuário
- policies RLS para leitura e gestão pelas áreas autorizadas

## Como configurar as policies RLS

As policies já estão incluídas nas migrations. Depois de aplicar os arquivos, confirme no Supabase:

- `profiles`: usuário vê o próprio perfil; staff vê tudo
- `creators`: creator vê o próprio cadastro; staff gerencia todos
- `creator_rooms`: creator vê a própria sala; staff gerencia todas
- `metric_submissions`: creator vê e envia apenas as próprias métricas; staff revisa tudo
- `metric_attachments`: creator manipula apenas os próprios anexos; staff acessa tudo
- `creator_notices`: creator vê avisos permitidos para seu contexto; staff cria e visualiza tudo
- `metric_reviews`: creator vê reviews das próprias métricas; staff registra decisões
- `discord_settings`: staff visualiza; admin geral pode alterar
- `discord_message_logs`: staff acompanha o resultado dos envios
- `creator_tickets`: staff gerencia tickets; creator vê apenas o próprio ticket vinculado ao `discord_id`
- `discord_panels`: staff acompanha o painel publicado
- `discord_bot_logs`: staff acompanha logs do bot

## Como criar o bucket de uploads

O bucket é criado pela migration inicial com estas regras:

- nome: `metric-attachments`
- privado (`public = false`)
- formatos aceitos: `PNG`, `JPG`, `JPEG`, `WEBP`
- limite por arquivo: `5 MB`
- estrutura de pasta: `creator_id/arquivo.ext`

As policies do Storage garantem que:

- creators só enviem e leiam arquivos da própria pasta
- admins e responsáveis creators possam visualizar e administrar anexos

## Como preparar o primeiro administrador

1. Em `Authentication > Users`, crie o usuário com o e-mail `diretorsnow@coliseurp.br`.
2. Defina a senha diretamente no Supabase Auth. Não existe senha fixa no código.
3. Depois de criar o usuário, execute `supabase/seeds/initial_admin.sql`.
4. Esse script ajusta o perfil para `admin_general`.
5. O usuário `Snow` será direcionado à Central de Creators após o login.

## Como rodar o site localmente

1. Instale as dependências:

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

3. Preencha as variáveis do Supabase e do Discord.
4. Rode o site:

```bash
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000).

### Fallback de desenvolvimento

- Se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem configuradas, o site entra em modo demo em ambiente local.
- Se o bot estiver sem `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`, tickets, painéis e logs usam fallback em memória apenas para desenvolvimento.

## Como rodar o bot localmente

O bot roda separado do site.

Scripts disponíveis:

```bash
npm run bot:dev
npm run bot:start
```

O entrypoint fica em `src/bot/index.ts`.

Na inicialização, o bot:

- valida variáveis obrigatórias
- cria o client do Discord com `Guilds` e `GuildMembers`
- registra eventos e interações
- conecta ao Discord com `DISCORD_BOT_TOKEN`

Logs esperados:

- `Bot Creators Coliseu online como ...`
- `Auto cargo Cidadão ativado.`
- `Sistema de tickets carregado.`
- `Painel de tickets pronto para publicação.`

## Funcionalidades do bot

### 1. Cargo automático ao entrar

Quando um novo membro entra no servidor:

- o evento `guildMemberAdd` é acionado
- o bot tenta adicionar `DISCORD_CITIZEN_ROLE_ID`
- o resultado é registrado em log

Logs previstos:

- `member_join_role_assigned`
- `member_join_role_failed`

### 2. Sistema de tickets

O painel de tickets publica um embed no canal `DISCORD_TICKET_CHANNEL_ID` com um menu de seleção para o creator escolher o tipo de atendimento.

`customId` usados:

- `creator_ticket_type_select`
- `creator_ticket_close`

Opções do painel:

- `📸 Atendimento Influencer`
- `🎮 Atendimento Streamer`

Ao selecionar uma opção:

- o bot verifica se já existe ticket aberto para o usuário
- cria um canal privado na categoria `DISCORD_CREATORS_CATEGORY_ID`
- usa o formato `ticket-influencer-{usuario}` ou `ticket-streamer-{usuario}`
- aplica permissões para o creator, o cargo principal `DISCORD_RESPONSAVEL_STAFF_ROLE_ID`, cargos extras em `DISCORD_STAFF_ROLE_IDS` e o próprio bot
- registra o ticket em `creator_tickets` com `ticket_type`
- envia mensagem inicial específica para influencer ou streamer
- marca o cargo responsável na abertura do atendimento

Ao fechar:

- staff, admin ou o próprio creator podem encerrar
- o ticket é marcado como `closed` ou `archived`
- o canal é movido para `DISCORD_ARCHIVED_TICKETS_CATEGORY_ID` quando existir
- se não existir categoria de arquivados, o canal é removido

Logs previstos:

- `ticket_panel_published`
- `ticket_panel_failed`
- `ticket_type_selected`
- `ticket_streamer_created`
- `ticket_influencer_created`
- `ticket_create_failed`
- `ticket_duplicate_blocked`
- `ticket_closed`
- `ticket_close_failed`

### 3. Publicação do painel

O projeto já possui rota segura para o painel administrativo:

- `POST /api/discord/setup-tickets`

Ela:

- publica ou atualiza o embed com menu de seleção no canal de tickets
- reutiliza a mensagem anterior quando possível
- evita duplicidade salvando `message_id` em `discord_panels`

O painel administrativo também já possui o botão:

- `Publicar painel de tickets`

### 4. Formulário oficial de inscrições

O bot também pode publicar o painel do formulário no canal `DISCORD_CREATOR_FORM_CHANNEL_ID`.

Fluxo:

- o painel exibe o botão `Participar Creators`
- ao clicar, o bot abre um modal com os campos principais da inscrição
- a resposta é salva em `creator_applications` com `source = 'discord'`
- o bot envia um embed para `DISCORD_CREATOR_FORM_SUBMISSIONS_CHANNEL_ID`
- a equipe pode aprovar ou negar diretamente pelo Discord
- na aprovação, o bot tenta enviar DM e adicionar `DISCORD_APPROVED_CREATOR_ROLE_ID`
- na negação, o bot pede um motivo e envia DM quando possível

Rota segura disponível:

- `POST /api/discord/setup-creator-form`

No site, a página `Fila de inscrições` também permite:

- aprovar inscrições vindas do site
- aprovar inscrições vindas do Discord
- negar com motivo obrigatório
- visualizar a origem `Site` ou `Discord`
- publicar o painel do formulário sem sair da central

## Integração com o site

Na Central de Creators e em Configurações do Discord, o painel já mostra:

- total de tickets abertos
- tickets fechados
- tickets arquivados
- filtro por tipo de ticket
- últimos tickets criados
- status do painel publicado
- configuração dos canais do Discord

Na fila de inscrições, o site agora mostra:

- origem da inscrição
- status da análise
- responsável que analisou
- data da análise
- motivo da negação, quando existir
- ações de `Aprovar` e `Negar`

## Permissões necessárias do bot no Discord

O bot precisa destas permissões:

- View Channels
- Send Messages
- Read Message History
- Manage Channels
- Manage Roles
- Manage Messages
- Manage Permissions
- Embed Links
- Attach Files
- Use Application Commands

Também garanta:

- o cargo do bot acima do cargo Cidadão
- o cargo do bot acima de qualquer cargo que ele precise gerenciar
- o cargo do bot acima do `DISCORD_RESPONSAVEL_STAFF_ROLE_ID`
- o cargo do bot acima do `DISCORD_APPROVED_CREATOR_ROLE_ID`
- permissão para criar canais na categoria dos creators
- permissão para ver e enviar mensagens no canal de tickets
- permissão para ver e enviar mensagens no canal de avisos
- permissão para ver e enviar mensagens no canal do formulário
- permissão para ver e enviar mensagens no canal de formulários enviados
- o bot pode falhar ao mandar DM se o usuário bloquear mensagens privadas do servidor

## Discord Developer Portal

No [Discord Developer Portal](https://discord.com/developers/applications):

1. Abra a aplicação do bot.
2. Vá em `Bot`.
3. Ative `Server Members Intent / Guild Members Intent`.
4. Salve as alterações.

Isso é obrigatório para o auto cargo funcionar ao detectar novos membros no servidor.

## Como fazer deploy do site na Vercel

1. Suba o projeto para o GitHub.
2. Na [Vercel](https://vercel.com/), importe o repositório.
3. Vá em `Settings > Environment Variables`.
4. Cadastre todas as variáveis do site e do backend.
5. Faça um novo deploy sempre que alterar variáveis.

Observações:

- o site continua na Vercel
- a Vercel não deve ser usada para manter o bot conectado via WebSocket/Gateway

## Como deixar o bot 24h online

O bot deve rodar em um serviço próprio, como:

- Railway
- Render
- Fly.io
- VPS

Fluxo recomendado:

1. Suba o projeto no GitHub.
2. Crie um serviço Node.js no provedor escolhido.
3. Defina o start command:

```bash
npm run bot:start
```

4. Configure as variáveis de ambiente do bot e do Supabase.
5. Acompanhe os logs do serviço.
6. Confirme se aparece:

```text
Bot Creators Coliseu online como ...
```

Importante:

- o site fica na Vercel
- o banco fica no Supabase
- o bot fica separado em processo Node.js contínuo
- não use a Vercel para manter o bot online

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run bot:dev
npm run bot:start
```
