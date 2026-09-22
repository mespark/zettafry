import { createFileRoute } from "@tanstack/react-router";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { TiltCard } from "@/components/site/TiltCard";
import { Reveal } from "@/components/site/Reveal";
import { services } from "@/data/content";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Zettafry Bills to Excel" },
      {
        name: "description",
        content:
          "AI bill processing, bill-to-Excel conversion, intelligent extraction, bulk processing, custom fields and document automation.",
      },
      { property: "og:title", content: "Services — Zettafry Bills to Excel" },
      {
        property: "og:description",
        content: "Everything Zettafry does with your bills, receipts and business documents.",
      },
      { property: "og:url", content: `${SITE_URL}/services` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/services` }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Services"
        title="Everything Zettafry does with your documents"
        subtitle="From a photo of a receipt to a structured, searchable Excel file."
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
    </PageShell>
  );
}