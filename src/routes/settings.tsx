import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/game/settings-view";

export const Route = createFileRoute("/settings")({ component: SettingsView });
