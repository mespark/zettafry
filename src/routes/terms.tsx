import { createFileRoute } from "@tanstack/react-router";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Zettafry Bills to Excel" },
      {
        name: "description",
        content: "The terms that govern your use of Zettafry — Bills to Excel.",
      },
      { property: "og:title", content: "Terms of Service — Zettafry Bills to Excel" },
      { property: "og:description", content: "The terms that govern your use of Zettafry — Bills to Excel." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/terms` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/terms` }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="Last updated: August 2026"
      />

      <div className="mt-10 glass rounded-3xl p-7 sm:p-9 space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <section>
          <h2 className="text-lg font-medium text-foreground">1. Acceptance of terms</h2>
          <p className="mt-2">
            By creating an account or using Zettafry — Bills to Excel, you agree to these Terms of
            Service and our Privacy Policy. If you do not agree, please do not
            use Zettafry — Bills to Excel.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">2. What Zettafry — Bills to Excel does</h2>
          <p className="mt-2">
            Zettafry — Bills to Excel is an AI-powered tool that extracts structured data (such as
            vendor, amounts, dates, GST details and line items) from invoices,
            bills and receipts you upload, and lets you export the results as
            Excel files. Extraction is performed by third-party AI models and,
            like any AI system, may occasionally produce inaccurate results.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">3. Your responsibilities</h2>
          <p className="mt-2">
            You are responsible for the accuracy of any data you rely on from
            Zettafry — Bills to Excel's output. <strong className="text-foreground">Always verify extracted
            figures before using them for accounting, tax filing, or any other
            official purpose.</strong> You must only upload documents you have the
            right to process, and must not use Zettafry — Bills to Excel for any unlawful purpose or to
            upload content that is illegal, harmful, or infringes on others'
            rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">4. Free tier and limits</h2>
          <p className="mt-2">
            Zettafry — Bills to Excel offers a free daily usage tier for messages and file uploads.
            These limits may change at any time at our discretion, and reset
            daily. Attempting to circumvent usage limits (e.g. through automated
            requests or multiple accounts to bypass limits) is not permitted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">5. No warranty</h2>
          <p className="mt-2">
            Zettafry — Bills to Excel is provided "as is" without warranties of any kind, express or
            implied. We do not guarantee that extraction results will be 100%
            accurate, or that the service will be uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">6. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, Zettafry — Bills to Excel and its creator shall
            not be liable for any indirect, incidental, or consequential damages
            arising from your use of the service, including but not limited to
            financial loss resulting from inaccurate extraction results that were
            not independently verified.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">7. Account termination</h2>
          <p className="mt-2">
            We may suspend or terminate accounts that violate these terms, abuse
            the service, or attempt to circumvent usage limits or security
            measures. You may stop using Zettafry — Bills to Excel and request deletion of your
            account at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">8. Changes to the service</h2>
          <p className="mt-2">
            We may modify, suspend, or discontinue any part of Zettafry — Bills to Excel at any time.
            We'll try to give reasonable notice of significant changes where
            practical.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">9. Changes to these terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. We'll update the "Last
            updated" date above when we do. Continued use of Zettafry — Bills to Excel after changes
            means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">10. Contact us</h2>
          <p className="mt-2">
            For any questions about these terms, reach us at{" "}
            <a href="mailto:contact@mespark.in" className="text-primary">
              contact@mespark.in
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
