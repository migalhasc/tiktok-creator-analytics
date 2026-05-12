export type ProviderErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "PRIVATE_PROFILE"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "TEMPORARY_UNAVAILABLE"
  | "ASYNC_COLLECTION_FAILED"
  | "CONFIGURATION"
  | "BAD_RESPONSE";

export class TikTokInfrastructureError extends Error {
  code: Extract<ProviderErrorCode, "TEMPORARY_UNAVAILABLE" | "CONFIGURATION">;
  status: number;
  publicMessage: string;

  constructor(args: {
    code?: Extract<ProviderErrorCode, "TEMPORARY_UNAVAILABLE" | "CONFIGURATION">;
    message: string;
    publicMessage?: string;
    status?: number;
  }) {
    super(args.message);
    this.name = "TikTokInfrastructureError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = args.code ?? "TEMPORARY_UNAVAILABLE";
    this.status = args.status ?? (this.code === "CONFIGURATION" ? 500 : 503);
    this.publicMessage =
      args.publicMessage ??
      (this.code === "CONFIGURATION"
        ? "A configuração do servidor está incompleta."
        : "O serviço está temporariamente indisponível. Tente novamente em instantes.");
  }
}

export class TikTokProviderError extends Error {
  code: ProviderErrorCode;
  status: number;
  retryable: boolean;
  providerPayload?: Record<string, unknown>;

  constructor(args: {
    code: ProviderErrorCode;
    message: string;
    status: number;
    retryable?: boolean;
    providerPayload?: Record<string, unknown>;
  }) {
    super(args.message);
    this.name = "TikTokProviderError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = args.code;
    this.status = args.status;
    this.retryable = args.retryable ?? false;
    this.providerPayload = args.providerPayload;
  }
}

export function translateProviderError(error: unknown): { httpStatus: number; code: ProviderErrorCode; publicMessage: string } {
  if (error instanceof TikTokInfrastructureError) {
    return {
      httpStatus: error.status,
      code: error.code,
      publicMessage: error.publicMessage,
    };
  }

  if (error instanceof TikTokProviderError) {
    const messageMap: Record<ProviderErrorCode, string> = {
      INVALID_INPUT: "Use um username ou URL pública de perfil do TikTok.",
      NOT_FOUND: "Perfil não encontrado ou removido.",
      PRIVATE_PROFILE: "Este perfil não está disponível publicamente.",
      RATE_LIMITED: "Muitas tentativas em sequência. Tente novamente em instantes.",
      UPSTREAM_TIMEOUT: "A busca demorou mais do que o esperado. Tente novamente.",
      TEMPORARY_UNAVAILABLE: "O serviço de coleta está temporariamente indisponível.",
      ASYNC_COLLECTION_FAILED: "Não foi possível concluir a atualização dos dados agora.",
      CONFIGURATION: "A configuração do servidor está incompleta.",
      BAD_RESPONSE: "Os dados retornados não vieram em um formato suportado.",
    };

    return {
      httpStatus: error.status,
      code: error.code,
      publicMessage: messageMap[error.code],
    };
  }

  return {
    httpStatus: 503,
    code: "TEMPORARY_UNAVAILABLE",
    publicMessage: "O serviço está temporariamente indisponível. Tente novamente em instantes.",
  };
}
