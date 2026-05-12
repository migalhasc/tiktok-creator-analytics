import type { DashboardPayload } from "@shared/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataCoverageProps = {
  dashboard: DashboardPayload;
};

function CoverageColumn(props: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
        <p className="text-sm text-muted-foreground">{props.subtitle}</p>
      </div>
      <ul className="space-y-2 text-sm text-foreground">
        {props.items.map((item) => (
          <li key={item} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DataCoverage({ dashboard }: DataCoverageProps) {
  const savedAvailable = dashboard.filterAvailability.saved.enabled;
  const repostedAvailable = dashboard.filterAvailability.reposted.enabled;

  return (
    <Card>
      <CardHeader className="gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Nesta versão</p>
        <CardTitle>O que você acompanha aqui</CardTitle>
        <p className="text-sm text-muted-foreground">
          A primeira versão foi pensada para mostrar o que já dá para acompanhar com clareza agora, o que pode crescer nas
          próximas iterações e o que continua disponível só dentro do app do TikTok.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <CoverageColumn
            title="Agora"
            subtitle="O que já está pronto nesta experiência."
            items={[
              "Resumo do perfil com seguidores, seguindo, curtidas totais e quantidade de vídeos.",
              "Leitura das publicações com views, curtidas, comentários, compartilhamentos e data.",
              "Ranking das publicações por desempenho para encontrar o que mais puxou resultado.",
              savedAvailable
                ? "Salvos já podem entrar quando esse sinal vier de forma consistente neste perfil."
                : "Salvos ainda não aparecem de forma consistente neste perfil, então ficam fora da leitura principal.",
              repostedAvailable
                ? "Reposts já podem entrar quando esse sinal vier de forma consistente neste perfil."
                : "Reposts ainda não aparecem de forma consistente neste perfil, então ficam fora da leitura principal.",
            ]}
          />

          <CoverageColumn
            title="Em breve"
            subtitle="Expansões possíveis sem inventar dado privado."
            items={[
              "Comentários completos por publicação para enriquecer a leitura do conteúdo.",
              "Contexto por hashtag, temas e perfis relacionados.",
              "Mais sinais públicos quando cada perfil realmente trouxer esse dado com consistência.",
              "Histórico mais rico com novas coletas para acompanhar tendência ao longo do tempo.",
            ]}
          />

          <CoverageColumn
            title="No app do TikTok"
            subtitle="Informações que dependem do ambiente autenticado do criador."
            items={[
              "Views de perfil.",
              "Novos espectadores, recorrentes e total de viewers.",
              "Demografia da audiência, como gênero, idade e localização.",
              "Horários mais ativos de seguidores e espectadores.",
              "Origem do tráfego, termos de busca e recompensas.",
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
