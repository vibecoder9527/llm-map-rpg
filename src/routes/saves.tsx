import { createFileRoute } from "@tanstack/react-router";
import { SavesView } from "@/components/game/saves-view";

export const Route = createFileRoute("/saves")({ component: SavesView });
