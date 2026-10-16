import { Link, useRouterState } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Toaster } from "sonner";
import { cn } from "@/lib/cn";
import { STATUS_LABEL, useCivic } from "@/lib/store";
import type { Role, TicketStatus } from "@/lib/types";

export const buttonStyles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-teal text-paper hover:bg-teal-deep",
        asphalt: "bg-asphalt text-on-asphalt hover:bg-asphalt-2",
        line: "border border-line bg-sheet text-ink hover:border-teal",
        ghost: "bg-transparent text-ink hover:bg-foam",
        danger: "bg-danger text-paper hover:opacity-90",
        amber: "bg-amber text-paper hover:opacity-90",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  variant,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant }), className)} {...props} />;
}

const LINKS = [
  { to: "/report", label: "Report" },
  { to: "/ledger", label: "Ledger" },
  { to: "/jobs", label: "Jobs" },
  { to: "/training", label: "Training" },
  { to: "/become", label: "Start a crew" },
  { to: "/towns", label: "Towns" },
  { to: "/mission", label: "Mission" },
  { to: "/admin", label: "Public works" },
] as const;

const ROLES: { id: Role; label: string }[] = [
  { id: "resident", label: "Resident" },
  { id: "crew", label: "Crew" },
  { id: "dpw", label: "Public works" },
];

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-md bg-teal",
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 bg-amber" />
      <span className="relative size-2.5 rounded-sm bg-paper" />
    </span>
  );
}

const pillClass: Record<TicketStatus, string> = {
  REPORTED: "bg-foam text-teal-deep",
  APPROVED_FOR_BID: "bg-amber-soft text-ink",
  CLAIMED: "bg-amber-soft text-ink",
  WORK_SUBMITTED: "bg-foam text-teal-deep",
  VERIFIED_PAID: "bg-teal text-paper",
  REJECTED: "bg-danger-soft text-danger",
};

export function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md px-2 text-xs font-semibold",
        pillClass[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const fieldClass =
  "min-h-11 w-full rounded-md border border-line bg-sheet px-3 text-base text-ink";

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const role = useCivic((state) => state.role);
  const setRole = useCivic((state) => state.setRole);
  const activated = useCivic((state) => Boolean(state.onboarding.activatedAt));
  const resetDemo = useCivic((state) => state.resetDemo);
  const sealNotices = useCivic((state) => state.sealNotices);
  const sweepExpired = useCivic((state) => state.sweepExpired);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      await useCivic.persist.rehydrate();
      if (cancel) return;
      useCivic.getState().sweepExpired();
      await useCivic.getState().sealNotices();
    })();
    return () => {
      cancel = true;
    };
  }, [sealNotices, sweepExpired]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="no-print bg-asphalt text-on-asphalt">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Mark />
            <span className="font-display text-xl font-semibold tracking-tight">CivicPatch</span>
          </Link>
          <div
            className="grid w-full grid-cols-3 rounded-md bg-asphalt-2 p-1 sm:ml-auto sm:w-auto"
            role="group"
            aria-label="View the pilot as"
          >
            {ROLES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={role === item.id}
                onClick={() => setRole(item.id)}
                className={cn(
                  "min-h-11 rounded-sm px-2 text-sm font-semibold",
                  role === item.id ? "bg-paper text-ink" : "text-on-asphalt",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <nav className="flex w-full gap-1 overflow-x-auto pb-1" aria-label="Primary">
            {LINKS.map((link) => {
              const active = path === link.to || path.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-semibold",
                    active ? "bg-paper text-ink" : "text-on-asphalt hover:bg-asphalt-2",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="h-1 bg-amber" />
      </header>
      {role === "crew" && !activated ? (
        <div className="no-print border-b border-line bg-amber-soft">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span>Your crew is not active yet. The path from zero to a first job is one step at a time.</span>
            <Link to="/become" className="font-semibold text-teal-deep underline">
              Start a crew
            </Link>
          </p>
        </div>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="no-print border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted">
          <p>
            CivicPatch is a nonprofit operating model for small road repairs. Statutory notes are
            summaries so a town can see the shape of its own rules. They are not legal advice. If you
            were hurt, you may still have a separate, short deadline to notify the municipality.
          </p>
          <p>The ledger in this pilot stays on this device so you can try every role.</p>
          <button
            type="button"
            className="self-start font-semibold text-teal-deep underline"
            onClick={() => {
              resetDemo();
              void sealNotices();
            }}
          >
            Reset this device’s ledger
          </button>
        </div>
      </footer>
      <Toaster position="top-center" />
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-6 max-w-3xl">
      {kicker ? (
        <p className="text-sm font-semibold tracking-wide text-teal-deep uppercase">{kicker}</p>
      ) : null}
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      {lede ? <p className="mt-3 text-lg text-muted">{lede}</p> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-line bg-sheet p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}
