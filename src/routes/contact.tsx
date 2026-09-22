import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell, SectionHeading } from "@/components/site/Section";
import { getSupabase } from "@/lib/supabase";
import { sendContactEmail } from "@/lib/contact.functions";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Zettafry — Bills to Excel" },
      {
        name: "description",
        content:
          "Tell us what you want automated. We reply within one business day with a concrete next step.",
      },
      { property: "og:title", content: "Contact Zettafry — Bills to Excel" },
      {
        property: "og:description",
        content: "Tell us what you want automated and we'll reply within one business day.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/contact` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Tell us a bit more").max(1000),
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      company: form.get("company"),
      message: form.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSending(true);
    const supabase = getSupabase();
    if (!supabase) {
      setSending(false);
      toast.error(`Something's misconfigured — email us directly at ${CONTACT_EMAIL}.`);
      return;
    }

    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      message: parsed.data.message,
    });

    if (error) {
      setSending(false);
      toast.error(`Couldn't send — please email us directly at ${CONTACT_EMAIL}.`);
      return;
    }

    // Best-effort email notification — the message is already saved above,
    // so a failure here doesn't block the user.
    try {
      await sendContactEmail({ data: parsed.data });
    } catch {
      // swallow — DB insert already succeeded
    }

    setSending(false);
    toast.success("Thanks — we'll get back to you within one business day.");
    formEl.reset();
  };

  const field =
    "w-full rounded-xl border border-border bg-input/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Contact"
        title="Let's map your first automation"
        subtitle="Share the process that eats the most time. We'll come back with what it takes to automate it."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="glass rounded-2xl p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" placeholder="Your name" className={field} />
            <input name="email" type="email" placeholder="Work email" className={field} />
          </div>
          <input name="company" placeholder="Company (optional)" className={`${field} mt-4`} />
          <textarea
            name="message"
            rows={6}
            placeholder="What would you like to automate?"
            className={`${field} mt-4 resize-none`}
          />
          <button
            type="submit"
            disabled={sending}
            className="btn-shine mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_28px_var(--glow)] disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>

        <div className="space-y-4">
          {[
            { icon: Mail, label: "Email", value: "contact@mespark.in" },
            { icon: MapPin, label: "Studio", value: "Remote-first · India" },
          ].map((c) => (
            <div key={c.label} className="glass flex items-center gap-4 rounded-2xl p-5">
              <c.icon className="size-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{c.label}</p>
                <p className="text-sm">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
