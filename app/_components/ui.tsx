import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { getRoleMeta } from "@/app/_game/roles";
import type { RoleId } from "@/app/_game/types";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const playerPalette = [
  "var(--color-player-1)",
  "var(--color-player-2)",
  "var(--color-player-3)",
  "var(--color-player-4)",
  "var(--color-player-5)",
  "var(--color-player-6)",
  "var(--color-player-7)",
  "var(--color-player-8)",
  "var(--color-player-9)",
  "var(--color-player-10)",
] as const;

export function getPlayerColor(orderIndex: number) {
  return playerPalette[((orderIndex % playerPalette.length) + playerPalette.length) % playerPalette.length];
}

export function getPlayerStyle(orderIndex: number): CSSProperties {
  const accent = getPlayerColor(orderIndex);

  return {
    "--player-accent": accent,
    "--player-accent-soft": `color-mix(in srgb, ${accent} 18%, white)`,
    "--player-accent-strong": `color-mix(in srgb, ${accent} 70%, black)`,
  } as CSSProperties;
}

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "border-[color:var(--color-border-strong)] bg-[color:var(--color-action-primary)] text-[color:var(--color-text-primary)] shadow-[var(--shadow-rest)] hover:-translate-y-0.5 hover:bg-[color:var(--color-action-primary-soft)] active:translate-y-[3px] active:shadow-[var(--shadow-pressed)]",
    secondary:
      "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] shadow-[0_8px_0_rgba(68,51,37,0.92)] hover:-translate-y-0.5 hover:bg-[color:var(--color-bg-muted)] active:translate-y-[3px] active:shadow-[0_4px_0_rgba(68,51,37,0.92)]",
    ghost:
      "border-transparent bg-transparent text-[color:var(--color-text-secondary)] shadow-none hover:bg-white/45 hover:text-[color:var(--color-text-primary)] active:translate-y-0",
    danger:
      "border-[color:var(--color-border-strong)] bg-[color:var(--color-danger)] text-[color:var(--color-text-inverse)] shadow-[0_10px_0_rgba(93,18,18,0.9)] hover:-translate-y-0.5 hover:bg-[#e06565] active:translate-y-[3px] active:shadow-[0_5px_0_rgba(93,18,18,0.9)]",
  };

  return (
    <button
      className={`flex min-h-14 w-full items-center justify-center rounded-[var(--radius-md)] border-2 px-5 py-3 text-base font-black tracking-[-0.02em] transition-transform duration-[var(--motion-fast)] ease-out disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}

type ScreenProps = {
  backAction?: {
    danger?: boolean;
    label: string;
    onClick: () => void;
  };
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "private" | "celebration";
};

export function Screen({
  backAction,
  eyebrow,
  title,
  description,
  children,
  footer,
  tone = "default",
}: ScreenProps) {
  const tones = {
    default: {
      shell:
        "bg-[radial-gradient(circle_at_18%_0%,rgba(244,199,120,0.36),transparent_26rem),radial-gradient(circle_at_100%_100%,rgba(216,76,76,0.08),transparent_24rem)]",
      panel:
        "border-[color:var(--color-border-strong)] bg-[color:rgba(255,253,248,0.92)] text-[color:var(--color-text-primary)] shadow-[var(--shadow-rest)]",
      back: "border-[color:var(--color-border-strong)] bg-white/80 text-[color:var(--color-text-primary)]",
      eyebrow: "text-[#9b6515]",
      title: "text-[color:var(--color-text-primary)]",
      description: "text-[color:var(--color-text-secondary)]",
      footer: "border-[color:rgba(217,200,170,0.9)] bg-white/70",
    },
    private: {
      shell:
        "bg-[radial-gradient(circle_at_50%_0%,rgba(229,154,46,0.14),transparent_24rem),radial-gradient(circle_at_100%_100%,rgba(216,76,76,0.18),transparent_22rem)]",
      panel:
        "border-[color:var(--color-private-border)] bg-[linear-gradient(180deg,rgba(34,29,45,0.98),rgba(23,20,31,0.98))] text-[color:var(--color-text-inverse)] shadow-[0_16px_0_rgba(10,8,15,0.92)]",
      back: "border-[color:rgba(255,250,244,0.16)] bg-white/8 text-[color:var(--color-text-inverse)]",
      eyebrow: "text-[color:var(--color-action-primary-soft)]",
      title: "text-[color:var(--color-text-inverse)]",
      description: "text-[color:rgba(255,250,244,0.76)]",
      footer: "border-[color:rgba(255,250,244,0.12)] bg-black/18",
    },
    celebration: {
      shell:
        "bg-[radial-gradient(circle_at_0%_0%,rgba(47,154,103,0.18),transparent_26rem),radial-gradient(circle_at_100%_0%,rgba(244,199,120,0.32),transparent_24rem),radial-gradient(circle_at_100%_100%,rgba(216,76,76,0.08),transparent_24rem)]",
      panel:
        "border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,253,248,0.97),rgba(255,246,232,0.94))] text-[color:var(--color-text-primary)] shadow-[var(--shadow-rest)]",
      back: "border-[color:var(--color-border-strong)] bg-white/80 text-[color:var(--color-text-primary)]",
      eyebrow: "text-[color:var(--color-success)]",
      title: "text-[color:var(--color-text-primary)]",
      description: "text-[color:var(--color-text-secondary)]",
      footer: "border-[color:rgba(217,200,170,0.9)] bg-white/68",
    },
  } as const;

  const selectedTone = tones[tone];

  return (
    <main className={`min-h-dvh ${selectedTone.shell}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-4 sm:px-6">
        <section
          className={`flex min-h-[calc(100dvh-2rem)] flex-1 flex-col rounded-[var(--radius-xl)] border-2 p-5 backdrop-blur-sm sm:p-7 ${selectedTone.panel}`}
        >
          {backAction ? (
            <div className="mb-4">
              <button
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-black tracking-[0.01em] transition-transform duration-[var(--motion-fast)] ease-out hover:-translate-y-0.5 active:translate-y-0 ${
                  backAction.danger
                    ? "border-[#8f5a5a] bg-[#40242b]/85 text-[color:var(--color-text-inverse)]"
                    : selectedTone.back
                }`}
                onClick={backAction.onClick}
                type="button"
              >
                ← {backAction.label}
              </button>
            </div>
          ) : null}
          <div className="mb-6">
            {eyebrow ? (
              <p className={`mb-3 text-[length:var(--text-label)] font-black uppercase tracking-[0.28em] ${selectedTone.eyebrow}`}>
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={`text-balance font-black leading-[0.92] tracking-[-0.07em] [font-family:var(--font-display)] ${selectedTone.title}`}
              style={{ fontSize: "var(--text-display)" }}
            >
              {title}
            </h1>
            {description ? (
              <p className={`mt-4 max-w-md text-[length:var(--text-body)] font-semibold leading-7 ${selectedTone.description}`}>
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-4">{children}</div>
          {footer ? (
            <div
              className={`mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border-t px-0 pt-4 sm:pt-5 ${selectedTone.footer}`}
            >
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-white/72 p-4 shadow-[var(--shadow-soft)]">
      <span className="text-sm font-black text-[color:var(--color-text-primary)]">{label}</span>
      {children}
      {hint ? <span className="text-sm font-semibold text-[color:var(--color-text-secondary)]">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Banner({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const tones = {
    default:
      "border-[#ddbb6f] bg-[#fff0cc] text-[color:var(--color-text-primary)]",
    danger:
      "border-[#d78a8a] bg-[#fbe4de] text-[#7d2222]",
    success:
      "border-[#86c5a7] bg-[#e7f6ee] text-[#165137]",
  };

  return (
    <div className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm font-bold ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return (
    <input
      className="min-h-13 rounded-[var(--radius-md)] border-2 border-[color:var(--color-border-strong)] bg-white px-4 text-base font-bold text-[color:var(--color-text-primary)] outline-none transition duration-[var(--motion-fast)] ease-out placeholder:text-[#ac9a8b] focus:ring-4 focus:ring-[color:rgba(229,154,46,0.22)]"
      {...props}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      className="min-h-13 rounded-[var(--radius-md)] border-2 border-[color:var(--color-border-strong)] bg-white px-4 text-base font-bold text-[color:var(--color-text-primary)] outline-none transition duration-[var(--motion-fast)] ease-out focus:ring-4 focus:ring-[color:rgba(229,154,46,0.22)]"
      {...props}
    />
  );
}

export function PlayerChip({
  name,
  orderIndex,
  emphasis = "normal",
  suffix,
}: {
  name: string;
  orderIndex: number;
  emphasis?: "normal" | "current" | "muted";
  suffix?: ReactNode;
}) {
  const emphasisClasses = {
    normal:
      "border-[color:var(--player-accent)] bg-[color:var(--player-accent-soft)] text-[color:var(--color-text-primary)]",
    current:
      "border-[color:var(--player-accent-strong)] bg-[color:var(--player-accent)] text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]",
    muted:
      "border-[color:rgba(105,88,75,0.28)] bg-[color:rgba(255,255,255,0.58)] text-[color:var(--color-text-secondary)] opacity-70",
  };

  return (
    <span
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-black tracking-[-0.01em] ${emphasisClasses[emphasis]}`}
      style={getPlayerStyle(orderIndex)}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-90" />
      <span>{name}</span>
      {suffix ? <span className="text-[0.7rem] font-black uppercase tracking-[0.12em] opacity-80">{suffix}</span> : null}
    </span>
  );
}

export function RevealPanel({
  eyebrow,
  title,
  description,
  danger = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center justify-center rounded-[calc(var(--radius-xl)+2px)] border px-6 py-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${
        danger
          ? "border-[#86525a] bg-[radial-gradient(circle_at_50%_0%,rgba(216,76,76,0.35),transparent_18rem),linear-gradient(180deg,rgba(58,22,28,0.98),rgba(29,14,20,0.98))] text-[color:var(--color-text-inverse)]"
          : "border-[color:rgba(255,250,244,0.14)] bg-[radial-gradient(circle_at_50%_0%,rgba(229,154,46,0.18),transparent_18rem),linear-gradient(180deg,rgba(31,27,41,0.98),rgba(20,17,28,0.98))] text-[color:var(--color-text-inverse)]"
      }`}
    >
      <div className="max-w-sm">
        <p className="text-[length:var(--text-label)] font-black uppercase tracking-[0.28em] text-[color:var(--color-action-primary-soft)]">
          {eyebrow}
        </p>
        <p className="mt-4 text-balance text-5xl font-black tracking-[-0.07em] [font-family:var(--font-display)] sm:text-6xl">
          {title}
        </p>
        <p className="mt-4 text-sm font-semibold leading-6 text-white/78 sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

export function RoleBadge({
  roleId,
  className = "",
}: {
  roleId: RoleId;
  className?: string;
}) {
  const role = getRoleMeta(roleId);
  const toneClass =
    role.tone === "danger"
      ? "border-[#a26571] bg-[#4a222b] text-[color:var(--color-text-inverse)]"
      : "border-[color:rgba(255,250,244,0.18)] bg-white/10 text-[color:var(--color-text-inverse)]";

  return (
    <span
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black tracking-[-0.01em] ${toneClass} ${className}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {role.emoji}
      </span>
      <span>{role.label}</span>
    </span>
  );
}
