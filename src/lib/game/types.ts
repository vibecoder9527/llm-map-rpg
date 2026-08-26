export type Vec2 = { x: number; y: number };

export type Proximity = "adjacent" | "near" | "same-area" | "distant" | "far";

export type SightLevel = "seen" | "glimpse" | "blind";
export type AlertState = "unaware" | "suspicious" | "alert";

export type MapAspect = "1:1" | "2:3" | "3:2" | "16:9" | "9:16";

export type MapObject = {
  id: string;
  label: string;
  kind: "furniture" | "door" | "landmark" | "hazard" | "container" | "other";
  /** Center, percent of map (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Paint order; lower is behind. Missing = size-based default. */
  z?: number;
  desc: string;
};

/** Unnamed background people. Ellipse on the map; not a character sheet. */
export type Crowd = {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Horizontal radius, percent of map. */
  rx: number;
  /** Vertical radius, percent of map. */
  ry: number;
  /** Unnamed heads still in the group. */
  size: number;
  desc: string;
  /** Named NPCs already drawn out of this group. */
  namedOut: number;
};

export type Character = {
  id: string;
  /** Name the player uses once they know this person. */
  name: string;
  /** Canonical name for the GM. Falls back to `name`. */
  trueName?: string;
  /** Player has learned who this is. Missing = legacy save (treat as known). */
  known?: boolean;
  /** Short look-label while unknown. Empty → derived from appearance. */
  alias?: string;
  role: "player" | "npc";
  bio: string;
  /** How they speak and decide; NPC-facing. */
  personality?: string;
  /** Whole years. Missing on old saves. */
  age: number;
  /** 男／女／其他；自由填。 */
  gender?: string;
  /** 人、精靈等；自由填。 */
  race?: string;
  /** Keywords for lore matching: 教團、職業、神祇。 */
  tags?: string[];
  /** Face and body; no clothes. */
  appearance: string;
  /** Full outfit, head to toe. */
  clothing: string;
  color: string;
  x: number;
  y: number;
  /** Degrees; 0 = up, clockwise. Missing = look toward map center. */
  facing?: number;
  /** How aware they are of the player. */
  alert?: AlertState;
  status: string;
  /** Short-term objective; rewritten each think beat. */
  goal?: string;
  /** Compressed personal notes for the next think beat. */
  memory?: string;
  /** Full-body portrait data URL, set after first mid-range look. */
  portrait?: string;
};

export type LoreEntry = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  /** Always injected into every NPC think beat (world facts). */
  constant?: boolean;
};

export type LogEntry = {
  id: string;
  at: number;
  kind: "narrative" | "action" | "system";
  text: string;
};

export type Scene = {
  id: string;
  name: string;
  summary: string;
  atmosphere: string;
  /** data URL or public path */
  mapImage: string;
  mapSource: "generated" | "schematic" | "sample";
  mapAspect: MapAspect;
  /** English prompt used to draw this map; kept for regen. */
  mapPrompt?: string;
  walkableNotes: string;
  objects: MapObject[];
  crowds: Crowd[];
  npcs: Character[];
  playerPos: Vec2;
};

export type Game = {
  version: 1;
  id: string;
  title: string;
  theme: string;
  /** Fallback for old saves; used if map/portrait style empty. */
  imageStyle: string;
  mapStyle?: string;
  portraitStyle?: string;
  createdAt: number;
  updatedAt: number;
  turnCount: number;
  lorebook: LoreEntry[];
  player: Character;
  inventory: string[];
  flags: Record<string, string>;
  scenes: Record<string, Scene>;
  currentSceneId: string;
  log: LogEntry[];
  suggested: string[];
  /** State before the last player turn; used to regenerate. */
  checkpoint?: Game;
};

export type SaveMeta = {
  id: string;
  title: string;
  theme: string;
  sceneName: string;
  playerName: string;
  turnCount: number;
  createdAt: number;
  updatedAt: number;
};

export type WorldDraft = {
  theme: string;
  imageStyle: string;
  mapStyle?: string;
  portraitStyle?: string;
  lorebook: LoreEntry[];
  player: Omit<Character, "x" | "y" | "role" | "id" | "color"> & {
    name: string;
    bio: string;
    appearance: string;
    status: string;
  };
  scene: {
    name: string;
    summary: string;
    atmosphere: string;
    mapPrompt: string;
    mapAspect: MapAspect;
  };
  npcs: Array<{
    name: string;
    bio: string;
    appearance: string;
    clothing: string;
    age?: number;
    gender?: string;
    race?: string;
    tags?: string[];
    personality?: string;
    status: string;
    where: string;
    goal?: string;
    trueName?: string;
    known?: boolean;
    alias?: string;
  }>;
  crowds?: Array<{
    label: string;
    desc: string;
    size?: number;
    x?: number;
    y?: number;
    r?: number;
    rx?: number;
    ry?: number;
    where?: string;
  }>;
};

export type AttemptKind = "move" | "talk" | "touch" | "look" | "leave" | "other";
export type PhysicsGate = "allowed" | "blocked" | "partial";
export type AttemptDifficulty = "easy" | "normal" | "hard";
export type ActorVerdict = "success" | "fail" | "mixed" | "blocked";

export type AttemptCard = {
  id: string;
  role: "player" | "npc";
  name: string;
  intent: string;
  kind: AttemptKind;
  from: Vec2;
  proximity: Proximity;
  hearPlayer: boolean;
  seePlayer: SightLevel;
  physics: PhysicsGate;
  physicsNote: string;
  difficulty: AttemptDifficulty;
};

export type DramaPlayer = Vec2 & {
  verdict?: ActorVerdict;
  did?: string;
  speech?: string;
  status?: string;
};

export type DramaNpc = {
  id: string;
  x: number;
  y: number;
  facing?: number;
  status: string;
  speech?: string;
  known?: boolean;
  name?: string;
  verdict?: ActorVerdict;
  did?: string;
};

export type DramaResult = {
  player: DramaPlayer;
  npcs: DramaNpc[];
  inventory?: string[];
  flags?: Record<string, string>;
  suggested?: string[];
  crowds?: TurnResult["crowds"];
  spawnFromCrowd?: TurnResult["spawnFromCrowd"];
  sceneChange?: TurnResult["sceneChange"];
};

export type NpcThought = {
  id: string;
  name: string;
  /** Present-tense inner line, very short. */
  thought: string;
  /** What they mean to do this beat. */
  intent: string;
  /** Updated short-term goal. */
  goal: string;
  /** Compressed private notes. */
  memory: string;
  /** Where they intend to look, 0 = up clockwise. */
  facing?: number;
};

export type TurnResult = {
  narrative: string;
  player: Vec2;
  npcs: Array<{
    id: string;
    x: number;
    y: number;
    facing?: number;
    status: string;
    speech?: string;
    known?: boolean;
    name?: string;
  }>;
  inventory?: string[];
  flags?: Record<string, string>;
  suggested?: string[];
  crowds?: Array<{
    id: string;
    x?: number;
    y?: number;
    r?: number;
    rx?: number;
    ry?: number;
    size?: number;
    label?: string;
    desc?: string;
    gone?: boolean;
  }>;
  spawnFromCrowd?: Array<{
    crowdId: string;
    npcs: Array<{
      name: string;
      bio: string;
      appearance: string;
      clothing?: string;
      age?: number;
      gender?: string;
      race?: string;
      personality?: string;
      status: string;
      goal?: string;
    }>;
  }>;
  sceneChange?: {
    name: string;
    summary: string;
    atmosphere: string;
    mapPrompt: string;
    mapAspect?: MapAspect;
    npcs: WorldDraft["npcs"];
    reason: string;
  } | null;
};

export type MapAnnotation = {
  title: string;
  walkableNotes: string;
  objects: MapObject[];
};
