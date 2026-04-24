import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-amber-300 text-stone-950 shadow-[0_10px_0_#8a5a10] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_5px_0_#8a5a10]",
    secondary:
      "border-2 border-stone-900 bg-stone-50 text-stone-950 shadow-[0_8px_0_#1c1917] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_#1c1917]",
    ghost: "bg-transparent text-stone-700 underline-offset-4 hover:underline",
    danger:
      "bg-rose-500 text-white shadow-[0_8px_0_#881337] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_#881337]",
  };

  return (
    <button
      className={`min-h-12 rounded-2xl px-5 py-3 text-base font-black tracking-tight transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
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
    default: "from-orange-50 via-amber-50 to-lime-100",
    private: "from-stone-950 via-slate-950 to-emerald-950 text-white",
    celebration: "from-lime-100 via-amber-100 to-orange-100",
  };

  return (
    <main
      className={`min-h-dvh bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.34),transparent_24rem),linear-gradient(135deg,var(--tw-gradient-stops))] ${tones[tone]}`}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-4 sm:px-6">
        <section className="flex flex-1 flex-col rounded-[2rem] border-2 border-stone-950/90 bg-white/78 p-5 shadow-[0_14px_0_rgba(28,25,23,0.95)] backdrop-blur sm:p-7">
          {backAction ? (
            <div className="mb-4">
              <button
                className={`min-h-11 rounded-full border-2 px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 active:translate-y-0 ${
                  backAction.danger
                    ? "border-rose-700 bg-rose-50 text-rose-800"
                    : "border-stone-900 bg-white text-stone-950"
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
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-amber-700">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-balance text-4xl font-black leading-none tracking-[-0.07em] text-stone-950 sm:text-6xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 text-pretty text-base font-semibold leading-7 text-stone-700 sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-4">{children}</div>
          {footer ? <div className="mt-6 flex flex-col gap-3">{footer}</div> : null}
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
    <label className="grid gap-2 rounded-3xl border-2 border-stone-200 bg-white/70 p-4">
      <span className="text-sm font-black text-stone-950">{label}</span>
      {children}
      {hint ? <span className="text-sm font-semibold text-stone-600">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-stone-900 bg-white p-4 shadow-[0_6px_0_#1c1917] ${className}`}>
      {children}
    </div>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-amber-700 bg-amber-100 p-4 text-sm font-bold text-stone-900">
      {children}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return (
    <input
      className="min-h-12 rounded-2xl border-2 border-stone-900 bg-white px-4 text-base font-bold text-stone-950 outline-none transition placeholder:text-stone-400 focus:ring-4 focus:ring-amber-300"
      {...props}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      className="min-h-12 rounded-2xl border-2 border-stone-900 bg-white px-4 text-base font-bold text-stone-950 outline-none transition focus:ring-4 focus:ring-amber-300"
      {...props}
    />
  );
}
