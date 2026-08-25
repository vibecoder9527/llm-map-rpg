import { createFileRoute } from "@tanstack/react-router";
import { CardsView } from "@/components/game/cards-view";

export const Route = createFileRoute("/cards")({ component: CardsView });
