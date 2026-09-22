import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { TiltCard } from "@/components/site/TiltCard";
import { Reveal } from "@/components/site/Reveal";
import { processSteps } from "@/data/content";
import { SITE_URL, PORTFOLIO_URL } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Zettafry — Bills to Excel" },
      {
        name: "description",
        content:
          "Zettafry — Bills to Excel turns bills and receipts into structured Excel data. Built by Spark, aka Ravi Yadav.",
      },
      { property: "og:title", content: "About Zettafry — Bills to Excel" },
      {
        property: "og:description",
        content: "Why Zettafry exists and how it turns manual data entry into minutes of work.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/about` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="About"
        title="Zettafry — Bills to Excel. Your paperwork shouldn't hold you down."
        subtitle="Zettafry is an AI-powered document automation platform built to turn bills and receipts into structured, ready-to-use Excel data."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal className="glass rounded-3xl p-7 sm:p-9">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload your documents, let Zettafry extract the information you need, and get organized
            files in minutes instead of spending hours on manual data entry.
          </p>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Built by <span className="text-foreground">Ravi Yadav</span>, also known as{" "}
            <span className="text-primary">Spark</span>, Zettafry focuses on making repetitive business
            workflows faster, simpler and smarter through AI automation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="btn-shine inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_var(--glow)]"
            >
              Try Zettafry free <ArrowRight className="size-4" />
            </Link>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              More of my work <ExternalLink className="size-4" />
            </a>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { k: "Minutes", v: "Instead of hours of manual entry" },
            { k: "Excel-ready", v: "Clean structured columns, every time" },
            { k: "Bulk", v: "Process a whole folder in one go" },
          ].map((s, i) => (
            <Reveal key={s.k} delay={i * 80} className="glass rounded-2xl p-6 text-center lg:text-left">
              <p className="font-display text-2xl text-glow sm:text-3xl">{s.k}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.v}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <SectionHeading eyebrow="How it works" title="Four steps from upload to Excel" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <Reveal className="mt-16">
        <div className="glass relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(600px circle at 50% 0%, oklch(0.82 0.14 192 / 16%), transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Built by Spark</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">
              I design and build products under the{" "}
              <span className="text-gradient-animated font-display">Fusion</span> umbrella —
              Zettafry is one of them.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Cybersecurity and software development, applied to real workflows. See the rest of what
              I've built.
            </p>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Visit mespark.in <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </Reveal>
    </PageShell>
  );
}
