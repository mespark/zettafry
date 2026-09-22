import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, FileSpreadsheet } from "lucide-react";
import { BrandMark } from "@/components/site/BrandMark";
import { Starfield } from "@/components/site/Starfield";
import { TiltCard } from "@/components/site/TiltCard";
import { SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { services, processSteps, plans } from "@/data/content";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zettafry — Bills to Excel, instantly" },
      {
        name: "description",
        content:
          "Zettafry — Bills to Excel converts bills and receipts into clean, structured Excel data in minutes.",
      },
      { property: "og:title", content: "Zettafry — Bills to Excel" },
      {
        property: "og:description",
        content: "Upload bills, extract the fields you need, download organized Excel files.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
        <div className="grid-floor pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] [mask-image:linear-gradient(to_top,black,transparent)] opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-10 hidden size-[46rem] rounded-full opacity-50 blur-3xl sm:block"
          style={{
            background: "radial-gradient(circle, oklch(0.82 0.14 192 / 26%), transparent 65%)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="animate-rise text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[10px] uppercase tracking-[0.24em] text-primary sm:text-[11px] sm:tracking-[0.28em]">
              <Sparkles className="size-3.5" /> AI document automation
            </span>
            <h1 className="mt-6 text-4xl leading-[1.06] sm:text-6xl lg:text-7xl">
              Bills in.
              <br />
              <span className="text-primary text-glow">Excel out.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
              Zettafry reads your bills and receipts with AI and gives you clean, structured Excel data
              — invoice numbers, GST, line items, taxes and totals. Minutes instead of hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                to="/auth"
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_36px_var(--glow)] sm:px-7"
              >
                Get started free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center rounded-full border border-border px-6 py-3.5 text-sm font-semibold hover:bg-secondary sm:px-7"
              >
                See pricing
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-60 blur-3xl"
              style={{
                background: "radial-gradient(circle, oklch(0.82 0.14 192 / 22%), transparent 70%)",
              }}
            />
            <div className="glass animate-rise relative rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <BrandMark className="size-14 sm:size-16" />
                <h2 className="mt-4 font-display text-xl font-semibold">Zettafry — Bills to Excel</h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Intelligence. Automated.
                </p>
              </div>

              <Link
                to="/auth"
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Continue with Google
              </Link>
              <Link
                to="/auth"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_var(--glow)]"
              >
                Sign in with email OTP
              </Link>
              <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <FileSpreadsheet className="size-3.5 text-primary" /> Free plan includes 3 bill
                uploads
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans, no surprises"
          subtitle="Start free. Upgrade when your bill volume grows."
          className="mx-auto text-center lg:mx-0 lg:text-left"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <TiltCard
                className={p.featured ? "ring-1 ring-primary/50 shadow-[0_0_60px_-20px_var(--glow)]" : ""}
              >
                {p.featured && (
                  <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                    Popular
                  </span>
                )}
                <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{p.name}</h3>
                <p className="mt-5 font-display text-4xl">{p.price}</p>
                <p className="text-xs text-muted-foreground">{p.note}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className={
                    p.featured
                      ? "btn-shine mt-8 inline-flex w-full justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                      : "mt-8 inline-flex w-full justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  }
                >
                  {p.price === "$0" ? "Start free" : "Choose plan"}
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="What Zettafry does"
          title="Everything between a paper bill and a finished spreadsheet"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <TiltCard>
                <s.icon className="size-7 text-primary" />
                <h3 className="mt-5 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="How it works" title="Four steps from upload to Excel" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((p, i) => (
            <Reveal key={p.step} delay={i * 80}>
              <TiltCard>
                <span className="font-display text-3xl text-primary/70">{p.step}</span>
                <h3 className="mt-4 text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-6">
          <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-8 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(600px circle at 50% 0%, oklch(0.82 0.14 192 / 18%), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl">Stop typing bills into spreadsheets</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Upload your first three bills free and see the Excel file Zettafry builds for you.
              </p>
              <Link
                to="/auth"
                className="btn-shine mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_36px_var(--glow)] sm:px-8 animate-glow-pulse"
              >
                Get started free <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
