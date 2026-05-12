import { LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
  helperText?: string | null;
  submitLabel?: string;
};

export function SearchForm({
  value,
  onChange,
  onSubmit,
  isPending = false,
  errorMessage,
  helperText,
  submitLabel = "Buscar perfil",
}: SearchFormProps) {
  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Cole o link do perfil ou digite o username"
            className="pl-11"
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {!errorMessage && helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
    </form>
  );
}
