import { useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getUserApiKey, setUserApiKey, type Provider } from "@/lib/user-keys";

type ProviderMeta = {
  label: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  steps: string[];
  needsModel?: boolean;
  modelPlaceholder?: string;
};

const PROVIDER_INFO: Record<Provider, ProviderMeta> = {
  groq: {
    label: "Groq",
    placeholder: "gsk_...",
    helpUrl: "https://console.groq.com/keys",
    helpLabel: "console.groq.com/keys",
    steps: [
      "Create a free account at console.groq.com — no credit card required.",
      "Open \"API Keys\" in the left sidebar and click \"Create API Key\".",
      "Copy the generated key and paste it below.",
    ],
  },
  gemini: {
    label: "Gemini",
    placeholder: "AIza...",
    helpUrl: "https://aistudio.google.com/apikey",
    helpLabel: "aistudio.google.com/apikey",
    steps: [
      "Go to aistudio.google.com/apikey and sign in with your Google account.",
      "Click \"Create API key\" — the free tier is enough for extraction.",
      "Copy the key and paste it below.",
    ],
  },
  openrouter: {
    label: "OpenRouter",
    placeholder: "sk-or-v1-...",
    helpUrl: "https://openrouter.ai/keys",
    helpLabel: "openrouter.ai/keys",
    steps: [
      "Sign up at openrouter.ai.",
      "Go to Settings → Keys and click \"Create Key\".",
      "Some models are free; others need a small top-up of credits.",
      "Also enter a model ID below — for example, a vision model like \"qwen/qwen2.5-vl-72b-instruct\".",
    ],
    needsModel: true,
    modelPlaceholder: "e.g. qwen/qwen2.5-vl-72b-instruct",
  },
};

export function ApiKeyPanel({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const existing = getUserApiKey();
  const [provider, setProvider] = useState<Provider>(existing?.provider ?? "groq");
  const [keys, setKeys] = useState<Record<Provider, string>>({
    groq: existing?.provider === "groq" ? existing.apiKey : "",
    gemini: existing?.provider === "gemini" ? existing.apiKey : "",
    openrouter: existing?.provider === "openrouter" ? existing.apiKey : "",
  });
  const [model, setModel] = useState(existing?.model ?? "");

  function handleSave() {
    const key = keys[provider].trim();
    if (!key) return;
    if (PROVIDER_INFO[provider].needsModel && !model.trim()) return;
    setUserApiKey({ provider, apiKey: key, model: model.trim() || undefined });
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Connect your AI provider
          </DialogTitle>
          <DialogDescription>
            Zettafry doesn&apos;t use a shared server key — add your own free API key instead.
            It&apos;s saved only in this browser and is never stored on our servers.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={provider} onValueChange={(v) => setProvider(v as Provider)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groq">Groq</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
          </TabsList>

          {(Object.keys(PROVIDER_INFO) as Provider[]).map((p) => (
            <TabsContent key={p} value={p} className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor={`${p}-key`}>{PROVIDER_INFO[p].label} API key</Label>
                <Input
                  id={`${p}-key`}
                  type="password"
                  autoComplete="off"
                  placeholder={PROVIDER_INFO[p].placeholder}
                  value={keys[p]}
                  onChange={(e) => setKeys((prev) => ({ ...prev, [p]: e.target.value }))}
                />
              </div>

              {PROVIDER_INFO[p].needsModel && (
                <div className="space-y-2">
                  <Label htmlFor={`${p}-model`}>Model ID</Label>
                  <Input
                    id={`${p}-model`}
                    placeholder={PROVIDER_INFO[p].modelPlaceholder}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="mb-2 font-medium text-foreground">How to get this key:</p>
                <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                  {PROVIDER_INFO[p].steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <a
                  href={PROVIDER_INFO[p].helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {PROVIDER_INFO[p].helpLabel} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save &amp; continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
