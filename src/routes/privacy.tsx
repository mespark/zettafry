import { createFileRoute } from "@tanstack/react-router";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Zettafry Bills to Excel" },
      {
        name: "description",
        content: "How Zettafry — Bills to Excel collects, uses and protects your data.",
      },
      { property: "og:title", content: "Privacy Policy — Zettafry Bills to Excel" },
      { property: "og:description", content: "How Zettafry — Bills to Excel collects, uses and protects your data." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/privacy` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="Last updated: August 2026"
      />

      <div className="mt-10 glass rounded-3xl p-7 sm:p-9 space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <section>
          <h2 className="text-lg font-medium text-foreground">1. What we collect</h2>
          <p className="mt-2">
            When you use Zettafry — Bills to Excel, we collect the information needed to run the service:
            your name and email address (via Google Sign-In or email verification),
            the files and images you upload for extraction, the structured data
            extracted from those files, and basic usage information such as how
            many messages and files you send per day.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">2. How we use it</h2>
          <p className="mt-2">
            We use your data to operate Zettafry — Bills to Excel: authenticating you, processing the
            documents you upload, storing your extraction history so you can access
            it across devices, enforcing daily usage limits, and improving the
            product. We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">3. Third-party processing</h2>
          <p className="mt-2">
            To extract structured data from your documents, Zettafry — Bills to Excel sends the content
            of uploaded files to third-party AI providers (currently Groq and, as a
            fallback, models hosted on Hugging Face) for processing. These providers
            process the content to return the extraction result and do not retain it
            for training on our plan. Authentication is handled by Firebase (Google
            Sign-In) and Supabase (email sign-in). Extraction history and usage data
            are stored in Supabase's database infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">4. Data retention</h2>
          <p className="mt-2">
            Your extraction history and daily usage counters are retained in our
            database for as long as your account is active, so you can access past
            results. You can request deletion of your account and associated data
            at any time by contacting us (see Section 7).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">5. Security</h2>
          <p className="mt-2">
            We use industry-standard measures to protect your data, including
            encrypted connections (HTTPS) and access controls that restrict who can
            read or modify stored data. No method of transmission or storage is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">6. Your rights</h2>
          <p className="mt-2">
            You can access, correct, or request deletion of your personal data and
            extraction history at any time. You can also stop using Zettafry — Bills to Excel and
            request account deletion by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">7. Contact us</h2>
          <p className="mt-2">
            For any privacy-related questions or requests, reach us at{" "}
            <a href="mailto:contact@mespark.in" className="text-primary">
              contact@mespark.in
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">8. Changes to this policy</h2>
          <p className="mt-2">
            We may update this policy from time to time. We'll update the "Last
            updated" date above when we do. Continued use of Zettafry — Bills to Excel after changes
            means you accept the updated policy.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
