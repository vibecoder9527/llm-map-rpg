import { createFileRoute } from "@tanstack/react-router";
import { Wizard } from "@/components/game/wizard";

export const Route = createFileRoute("/new")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { sample?: boolean; card?: string } => ({
    sample: search.sample === true || search.sample === "true" ? true : undefined,
    card: typeof search.card === "string" && search.card ? search.card : undefined,
  }),
  component: NewPage,
});

function NewPage() {
  const { sample, card } = Route.useSearch();
  return <Wizard sample={sample} cardId={card} />;
}
