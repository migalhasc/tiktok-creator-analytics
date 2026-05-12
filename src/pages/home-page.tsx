import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { defaultRange, defaultSort } from "@shared/domain";
import { normalizeProfileInput } from "@shared/profile-input";
import { SearchForm } from "@/components/search/search-form";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingTransition, startTransition] = useTransition();
  const deferredValue = useDeferredValue(value);
  const navigate = useNavigate();

  const helperText = useMemo(() => {
    if (!deferredValue.trim()) {
      return "Você pode usar @username ou a URL pública do perfil do TikTok.";
    }

    try {
      const normalized = normalizeProfileInput(deferredValue);
      return `Pronto para analisar @${normalized.username}.`;
    } catch {
      return "Use um username simples ou o link público do perfil.";
    }
  }, [deferredValue]);

  function handleSubmit() {
    try {
      const normalized = normalizeProfileInput(value);
      setErrorMessage(null);
      startTransition(() => {
        navigate(`/perfil/${normalized.username}?range=${defaultRange}&sort=${defaultSort}`);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Use um username simples ou o link público do perfil.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-border/80">
        <CardContent className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">MVP v1</p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Acompanhe seu desempenho no TikTok</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Veja com clareza quais publicações puxam mais resultado e como o perfil está se movimentando na janela escolhida.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-border bg-background p-4 sm:p-5">
              <SearchForm
                value={value}
                onChange={(nextValue) => {
                  setValue(nextValue);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                onSubmit={handleSubmit}
                isPending={isPendingTransition}
                errorMessage={errorMessage}
                helperText={helperText}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
