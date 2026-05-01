import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  Hash,
  Link2,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { getSessionContext } from "@/lib/session";

type IconComponent = (props: ComponentProps<"svg">) => ReactNode;

interface RankItem {
  title: string;
  badge: string;
  duration?: string;
  objective: string;
  requirements: string[];
  goals: string[];
  goalTitle: string;
  benefits: string[];
  note?: string;
  icon: IconComponent;
  accent: string;
  badgeClassName: string;
  featured?: boolean;
}

const influencerRequirements = [
  {
    icon: AtSign,
    text: "3 posts em colaboração com o Instagram oficial do Coliseu por semana",
  },
  {
    icon: Camera,
    text: "3 stories semanais marcando o Instagram oficial do Coliseu",
  },
  {
    icon: BadgeCheck,
    text: "Marcar o Instagram do Coliseu na bio do perfil",
  },
  {
    icon: Link2,
    text: "Manter o link de convite do Discord do Coliseu na bio",
  },
];

const influencerHighlights = [
  {
    icon: Video,
    text: "Produzir Reels marcando o Coliseu",
  },
  {
    icon: Hash,
    text: "Utilizar hashtags oficiais, como #coliseurp e #gtarp",
  },
  {
    icon: Sparkles,
    text: "Criar conteúdos criativos mostrando momentos marcantes da cidade",
  },
  {
    icon: Star,
    text: "Manter frequência e qualidade nas publicações",
  },
];

const ranks: RankItem[] = [
  {
    title: "Em Avaliação",
    badge: "Período inicial",
    duration: "7 dias",
    objective:
      "Validar a consistência, o comportamento e o comprometimento do streamer com o Coliseu RP.",
    requirements: [
      "Realizar no mínimo 3 lives no servidor",
      "Somar pelo menos 6 horas transmitidas",
      "Utilizar título e categoria corretos, mencionando o nome do servidor",
      "Manter bot, comando ou painel com o link da cidade",
      "Ter interação básica com o chat durante as lives",
    ],
    goals: ["Criar pelo menos 1 clipe ou momento interessante da live"],
    goalTitle: "Meta extra",
    benefits: [
      "Cargo temporário no Discord",
      "Possibilidade de progressão para o próximo rank",
      "Acompanhamento inicial pela equipe de creators",
    ],
    icon: ShieldCheck,
    accent: "border-[rgba(214,214,214,0.18)] bg-[linear-gradient(180deg,rgba(36,24,15,0.96),rgba(22,14,9,0.94))]",
    badgeClassName:
      "border-[rgba(214,214,214,0.22)] bg-[rgba(214,214,214,0.08)] text-[var(--muted)]",
  },
  {
    title: "Rank 3 — Iniciante Oficial",
    badge: "Streamer oficial",
    objective:
      "Primeiro nível oficial para creators que mantêm rotina, presença e divulgação consistente dentro da cidade.",
    requirements: [
      "Realizar 10 horas semanais de live no servidor",
      "Fazer live em pelo menos 5 dias diferentes na semana",
      "Manter título e categoria corretos durante as transmissões",
      "Divulgar corretamente o link da cidade",
    ],
    goals: ["Criar 2 clipes por semana"],
    goalTitle: "Meta extra",
    benefits: [
      "Cargo oficial de Streamer no Discord",
      "Permissão para divulgar lives nos canais definidos pela equipe",
      "Participação em promoções e eventos da cidade",
      "Direito a indicação de player, liberando o indicado sem whitelist, conforme regras internas",
    ],
    icon: Radio,
    accent: "border-[rgba(184,134,11,0.24)] bg-[linear-gradient(180deg,rgba(52,32,18,0.96),rgba(28,18,11,0.94))]",
    badgeClassName:
      "border-[rgba(184,134,11,0.28)] bg-[rgba(184,134,11,0.14)] text-[#f0d28a]",
  },
  {
    title: "Rank 2 — Crescimento",
    badge: "Creator em evolução",
    objective:
      "Fase de consolidação para creators que mantêm rotina forte, audiência real e presença constante dentro da comunidade.",
    requirements: [
      "Realizar 20 horas semanais de live",
      "Fazer live em pelo menos 5 dias diferentes na semana",
      "Manter média entre 5 e 10 espectadores reais",
      "Manter título e categoria corretos",
      "Utilizar bot, comando ou painel com o link da cidade",
    ],
    note:
      "Bots serão desconsiderados. Caso seja identificado uso de viewers falsos, o streamer poderá ser desvinculado do programa. A proposta do programa é fortalecer a cidade com conteúdo real, suporte aos creators e movimentação verdadeira da comunidade.",
    goals: [
      "Criar 2 clipes por semana",
      "Criar 1 Reels, Shorts ou TikTok por semana",
    ],
    goalTitle: "Meta extra",
    benefits: [
      "Destaque no Discord sempre que estiver em live",
      "Divulgação nas redes oficiais do servidor como streamer oficial",
      "Possibilidade de overlay customizada pela cidade",
      "Direito a indicação de player, liberando o indicado sem whitelist, conforme regras internas",
      "Possibilidade de receber código ou cupom especial, conforme análise da equipe",
    ],
    icon: TrendingUpIcon,
    accent: "border-[rgba(214,214,214,0.22)] bg-[linear-gradient(180deg,rgba(39,33,29,0.96),rgba(24,18,14,0.94))]",
    badgeClassName:
      "border-[rgba(214,214,214,0.2)] bg-[rgba(214,214,214,0.08)] text-[var(--white)]",
  },
  {
    title: "Rank 1 — Destaque",
    badge: "Alto desempenho",
    objective:
      "Nível máximo para creators que sustentam audiência, frequência, postura e impacto real para o Coliseu RP.",
    requirements: [
      "Realizar 30 horas ou mais de live por semana",
      "Fazer live em pelo menos 5 dias diferentes na semana",
      "Manter média mínima de 15 espectadores reais",
      "Manter engajamento com a comunidade",
      "Utilizar o link do servidor no perfil do Discord e no painel da Twitch",
      "Manter título e categoria corretos, mencionando o nome do servidor",
      "Utilizar bot, comando ou painel com o link da cidade",
    ],
    note:
      "Bots serão desconsiderados. Caso seja identificado uso de viewers falsos, o streamer poderá ser desvinculado do programa. A ideia é valorizar creators que movimentam a cidade com conteúdo real, frequência e qualidade.",
    goals: [
      "Criar conteúdo fora da live 3 vezes por semana, podendo ser TikTok, Shorts, Reels ou vídeo no YouTube",
      "Gerar engajamento positivo com a comunidade",
      "Manter postura adequada dentro e fora da cidade",
      "Representar bem o Coliseu RP",
    ],
    goalTitle: "Metas",
    benefits: [
      "Destaque no Discord sempre que estiver em live",
      "Divulgação nas redes oficiais do servidor como streamer oficial",
      "Possibilidade de overlay customizada pela cidade",
      "Direito a indicação de player, liberando o indicado sem whitelist, conforme regras internas",
      "Possibilidade de código ou cupom especial",
      "Possibilidade de incentivo financeiro, como cupom na loja, presentes, LivePix ou subs",
      "Análise para contrato com remuneração externa, conforme desempenho e decisão da equipe",
    ],
    icon: Crown,
    accent:
      "border-[rgba(245,197,66,0.34)] bg-[linear-gradient(180deg,rgba(58,34,15,0.98),rgba(32,18,9,0.95))] shadow-[0_0_0_1px_rgba(245,197,66,0.08),0_20px_70px_rgba(245,197,66,0.14)]",
    badgeClassName:
      "border-[rgba(245,197,66,0.34)] bg-[rgba(245,197,66,0.14)] text-[var(--gold)]",
    featured: true,
  },
] as const;

const importantRules = [
  "O uso de bots ou viewers falsos é proibido",
  "A equipe pode solicitar prints, links e comprovações de métricas",
  "A permanência no programa depende de frequência, postura e qualidade do conteúdo",
  "Benefícios podem variar conforme disponibilidade e análise da equipe",
  "A evolução de rank não é automática e depende de avaliação",
  "O creator deve representar o Coliseu RP com responsabilidade",
];

function TrendingUpIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

function BulletList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: readonly string[];
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--white)]">{title}</h3>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-[rgba(245,197,66,0.1)] bg-[rgba(18,10,5,0.46)] px-4 py-3"
          >
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--gold)]" />
            <p className="text-sm leading-7 text-[var(--muted)]">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankCard({
  title,
  badge,
  duration,
  objective,
  requirements,
  goals,
  goalTitle,
  benefits,
  note,
  icon: Icon,
  accent,
  badgeClassName,
  featured,
}: RankItem) {
  return (
    <article
      className={[
        "rounded-[30px] border p-6 shadow-[var(--shadow)] backdrop-blur-xl lg:p-7",
        accent,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={[
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border text-[var(--gold)]",
              featured
                ? "border-[rgba(245,197,66,0.34)] bg-[rgba(245,197,66,0.12)] shadow-[0_0_24px_rgba(245,197,66,0.12)]"
                : "border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.08)]",
            ].join(" ")}
          >
            <Icon className="h-6 w-6" />
          </div>

          <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
            {title}
          </h3>
        </div>

        <Pill className={badgeClassName}>{badge}</Pill>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {duration ? (
          <div className="rounded-[24px] border border-[rgba(245,197,66,0.14)] bg-[rgba(245,197,66,0.08)] p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="h-4.5 w-4.5 text-[var(--gold)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
                Duração
              </p>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-[var(--white)]">
              {duration}
            </p>
          </div>
        ) : null}

        <div
          className={[
            "rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4",
            duration ? "" : "md:col-span-2",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="flex items-center gap-3">
            <Target className="h-4.5 w-4.5 text-[var(--gold)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
              Objetivo
            </p>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{objective}</p>
        </div>
      </div>

      {note ? (
        <div className="mt-5 rounded-[24px] border border-[rgba(139,30,30,0.42)] bg-[linear-gradient(180deg,rgba(139,30,30,0.22),rgba(39,10,10,0.34))] px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#ffb8b8]" />
            <div>
              <p className="text-sm font-semibold text-[#ffe1e1]">Observação importante</p>
              <p className="mt-2 text-sm leading-7 text-[#ffd2d2]">{note}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <BulletList title="Requisitos" items={requirements} icon={CheckCircle2} />
        <BulletList title={goalTitle} items={goals} icon={Sparkles} />
        <BulletList title="Benefícios" items={benefits} icon={Crown} />
      </div>
    </article>
  );
}

export default async function RulesPage() {
  const actor = await getSessionContext();

  return (
    <PublicShell actor={actor} activeHref="/regras">
      <section className="page-shell pb-12 pt-10 lg:pb-16 lg:pt-14">
        <div className="surface-card gold-frame overflow-hidden px-6 py-8 lg:px-10 lg:py-10">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="eyebrow">Programa oficial</p>
              <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold tracking-tight text-[var(--white)] lg:text-6xl">
                Requisitos do Programa Creators Coliseu
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
                Confira os requisitos para participar e evoluir dentro do programa oficial de
                creators do Coliseu RP.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[26px] border border-[rgba(245,197,66,0.16)] bg-[rgba(255,255,255,0.03)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--white)]">
                      Influencers Coliseu
                    </p>
                    <p className="text-sm text-[var(--muted)]">Imagem forte nas redes sociais</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[rgba(245,197,66,0.16)] bg-[rgba(255,255,255,0.03)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--white)]">
                      Streamers Coliseu
                    </p>
                    <p className="text-sm text-[var(--muted)]">Evolução por ranques</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[rgba(245,197,66,0.16)] bg-[linear-gradient(180deg,rgba(245,197,66,0.1),rgba(255,255,255,0.03))] p-5 sm:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--white)]">
                      Progressão oficial
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Frequência, postura e desempenho definem a evolução.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-12">
        <div className="surface-card p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="eyebrow">Influencers Coliseu</p>
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
                Requisitos para Influencers Coliseu
              </h2>
              <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--muted)]">
                Os influencers do Coliseu RP ajudam a fortalecer a imagem da cidade nas
                redes sociais, divulgando conteúdos, marcando o perfil oficial e trazendo
                novos players para a comunidade.
              </p>
            </div>

            <Pill className="border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
              Redes sociais oficiais
            </Pill>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <BulletList
              title="Requisitos semanais"
              items={influencerRequirements.map((item) => item.text)}
              icon={AtSign}
            />

            <div className="rounded-[24px] border border-[rgba(245,197,66,0.22)] bg-[linear-gradient(180deg,rgba(245,197,66,0.12),rgba(255,255,255,0.03))] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]">
                  <Gem className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-[var(--white)]">
                    Diferencial
                  </p>
                  <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                    Essas ações não são obrigatórias, mas ajudam o creator a se destacar
                    dentro do programa.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {influencerHighlights.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-start gap-3 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.4)] px-4 py-3"
                  >
                    <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--gold)]" />
                    <p className="text-sm leading-7 text-[var(--muted)]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-12">
        <div className="surface-card-strong p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <p className="eyebrow">Programa de Streamers Coliseu</p>
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
                Programa de Streamers Coliseu
              </h2>
              <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--muted)]">
                O Programa de Streamers Coliseu possui uma estrutura de ranques criada
                para acompanhar a evolução dos creators, valorizar a consistência e
                reconhecer quem movimenta a cidade com conteúdo de qualidade.
              </p>
            </div>

            <Pill className="border-[rgba(245,197,66,0.24)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
              Estrutura oficial de evolução
            </Pill>
          </div>

          <div className="mt-8 rounded-[28px] border border-[rgba(245,197,66,0.16)] bg-[rgba(255,255,255,0.03)] p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Estrutura de Ranques</p>
                <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                  Cada fase do programa possui metas claras, benefícios próprios e uma
                  leitura objetiva do desempenho do creator.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 2xl:grid-cols-2">
              {ranks.map((rank) => (
                <RankCard key={rank.title} {...rank} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-12">
        <div className="rounded-[30px] border border-[rgba(139,30,30,0.42)] bg-[linear-gradient(180deg,rgba(63,13,13,0.46),rgba(20,9,8,0.94))] p-6 shadow-[var(--shadow)] lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,171,171,0.22)] bg-[rgba(139,30,30,0.22)] text-[#ffd2d2]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <p className="eyebrow text-[#ffb8b8]">Regras importantes</p>
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
                Regras importantes
              </h2>
              <p className="mt-4 max-w-4xl text-sm leading-8 text-[#ffd8d8]">
                Todos os creators devem manter boa conduta dentro e fora da cidade. A
                equipe poderá revisar, pausar ou remover participantes do programa caso
                identifique inatividade, má conduta, uso de bots, divulgação incorreta ou
                qualquer atitude que prejudique a imagem do Coliseu RP.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {importantRules.map((rule) => (
              <div
                key={rule}
                className="flex items-start gap-3 rounded-2xl border border-[rgba(255,184,184,0.18)] bg-[rgba(139,30,30,0.16)] px-4 py-3"
              >
                <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#ffb8b8]" />
                <p className="text-sm leading-7 text-[#ffe0e0]">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell pb-16">
        <div className="surface-card gold-frame overflow-hidden px-6 py-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Entrada na arena</p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
                Quer fazer parte da arena?
              </h2>
              <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
                Se você produz conteúdo, movimenta a comunidade e quer representar o
                Coliseu RP, envie sua inscrição para análise da equipe Creators Coliseu.
              </p>
            </div>

            <Link href="/inscricao" className="button-gold">
              Enviar inscrição
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
