import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Voltar para a busca" className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-muted text-foreground">
              <Search className="size-4" />
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground">TikTok Analytics</p>
              <p className="text-xs text-muted-foreground">Painel simples para acompanhar desempenho</p>
            </div>
          </Link>
          <p className="hidden text-xs text-muted-foreground lg:block">Leitura clara, direta e sem ruído.</p>
        </div>
      </header>
      <main className="page-frame">{children}</main>
    </div>
  );
}
