import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { TiltCard } from "@/components/site/TiltCard";
import { Reveal } from "@/components/site/Reveal";
import { plans } from "@/data/content";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Zettafry Bills to Excel" },
      {
        name: "description",
        content:
          "Zettafry pricing: Free with 3 bill uploads, Pro at $3.15/month, and 3-Month Pro at $5.24 for regular users.",
      },
      { property: "og:title", content: "Pricing — Zettafry Bills to Excel" },
      {
        property: "og:description",
        content: "Free, Pro and 3-Month Pro plans for AI bill-to-Excel conversion.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pricing` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pricing` }],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Pricing"
        title="Pay for the volume you actually process"
        subtitle="Start on the free plan with 3 uploads. Move to Pro when bills start piling up."
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
              {p.price === "$0" ? (
                <Link
                  to="/auth"
                  className={
                    p.featured
                      ? "btn-shine mt-8 inline-flex w-full justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                      : "mt-8 inline-flex w-full justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  }
                >
                  Start free
                </Link>
              ) : (
                <a
                  href={`mailto:contact@mespark.in?subject=${encodeURIComponent(
                    `Zettafry — ${p.name} plan`,
                  )}&body=${encodeURIComponent(
                    `Hi,\n\nI'd like to subscribe to the ${p.name} plan (${p.price}${p.note ? `, ${p.note}` : ""}).\n\n`,
                  )}`}
                  className={
                    p.featured
                      ? "btn-shine mt-8 inline-flex w-full justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                      : "mt-8 inline-flex w-full justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  }
                >
                  Choose plan
                </a>
              )}
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
