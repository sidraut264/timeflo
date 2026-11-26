export type LocationId =
  | 'main_hall'
  | 'library'
  | 'dining_room'
  | 'study'
  | 'kitchen'
  | 'upstairs_corridor'
  | 'guest_bedroom'
  | 'billiard_room'
  | 'basement';

export type CharacterId =
  | 'eleanor'
  | 'thomas'
  | 'margaret'
  | 'reed'
  | 'victor'
  | 'clara';

export type InteractionType = 'examine' | 'collect' | 'talk' | 'use' | 'move';

export type StoryFlag =
  | 'arrived_manor'
  | 'murder_discovered'
  | 'examined_body'
  | 'study_safe_opened'
  | 'medical_bag_opened'
  | 'secret_passage_found'
  | 'blueprint_studied'
  | 'confronted_eleanor'
  | 'confronted_thomas'
  | 'confronted_margaret'
  | 'confronted_victor'
  | 'confronted_clara'
  | 'confronted_reed'
  | 'accusation_ready'
  | 'case_closed';

export interface ClueItem {
  id: string;
  name: string;
  category: 'physical' | 'document' | 'key' | 'personal' | 'photograph';
  shortDesc: string;
  description: string;
  collectedAt: LocationId;
  collectedAtLabel: string;
  relevance: string;
  imagePath: string;
  /** Key used for procedural fallback icon rendering */
  iconKind:
    | 'telegram'
    | 'watch'
    | 'paperweight'
    | 'glass'
    | 'note'
    | 'handkerchief'
    | 'will'
    | 'ledger'
    | 'cigarette'
    | 'vial'
    | 'dossier'
    | 'footprint'
    | 'key'
    | 'sketchbook'
    | 'washcloth'
    | 'blueprint'
    | 'poker'
    | 'teacup';
  boardTags: string[];
}

export interface EvidenceLinkDefinition {
  id: string;
  clueA: string;
  clueB: string;
  title: string;
  deductionText: string;
  journalNote: string;
  unlocksFlag?: StoryFlag;
}

export interface HotspotDefinition {
  id: string;
  label: string;
  type: InteractionType;
  /** Normalized coordinates inside the 1600x720 world scene */
  x: number;
  y: number;
  width: number;
  height: number;
  depthLayer: 'midground' | 'foreground';
  targetLocation?: LocationId;
  characterId?: CharacterId;
  collectClueId?: string;
  requiredFlag?: StoryFlag;
  hiddenIfFlag?: StoryFlag;
  requiredClueId?: string;
  inspectTitle: string;
  inspectText: string;
  alreadyDoneText?: string;
  /** Optional interactive puzzle trigger */
  puzzleId?: 'force_study_door' | 'study_safe' | 'medical_bag' | 'wine_lever';
  /** Optional sprite/object key in procedural renderer */
  visualKind?: string;
}

export interface RoomAudioProfile {
  baseDroneHz: number;
  rainIntensity: number;
  thunderChance: number;
  tickingClock: boolean;
  fireplace: boolean;
  creaks: boolean;
  drip: boolean;
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
  subtitle: string;
  ambientDesc: string;
  worldWidth: number;
  worldHeight: number;
  /** Asset folder paths under assets/environments/<folder>/ */
  assetFolder: string;
  palette: {
    skyTop: string;
    skyBottom: string;
    farWall: string;
    midWall: string;
    floor: string;
    trim: string;
    lampGlow: string;
    accent: string;
  };
  audio: RoomAudioProfile;
  hotspots: HotspotDefinition[];
  exits: Array<{
    locationId: LocationId;
    label: string;
    direction: 'left' | 'right' | 'up' | 'down' | 'door';
  }>;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  requiredClueId?: string;
  requiredFlag?: StoryFlag;
  requiredLinkId?: string;
  hideIfFlag?: StoryFlag;
  tone?: 'neutral' | 'press' | 'evidence' | 'empathy';
}

export interface DialogueNode {
  id: string;
  speaker: string;
  portraitMood?: 'calm' | 'guarded' | 'nervous' | 'cold';
  text: string;
  setsFlag?: StoryFlag;
  grantsClueId?: string;
  journalEntry?: {
    id: string;
    category: 'clue' | 'conversation' | 'suspect' | 'timeline' | 'question';
    title: string;
    body: string;
  };
  choices: DialogueChoice[];
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  role: string;
  age: number;
  locationId: LocationId;
  spriteX: number;
  spriteY: number;
  /** Rendered height in room coordinates, tuned to the room's perspective. */
  spriteHeight: number;
  portraitPath: string;
  spritePath: string;
  personality: string;
  history: string;
  claimedAlibi: string;
  motiveSummary: string;
  secretSummary: string;
  relationships: string;
  coatColor: string;
  accentColor: string;
  hairColor: string;
  skinTone: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
  /** Reactions when player presents an inventory item directly */
  presentReactions: Record<
    string,
    {
      text: string;
      setsFlag?: StoryFlag;
      journalTitle?: string;
      journalBody?: string;
    }
  >;
  defaultPresentReaction: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  category: 'clue' | 'conversation' | 'suspect' | 'timeline' | 'deduction' | 'question';
  title: string;
  body: string;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface AccusationInput {
  culprit: CharacterId | '';
  motive: string;
  method: string;
  evidenceIds: string[];
  alibiTrick: string;
}

export type EndingOutcome =
  | 'true_justice'
  | 'partial_truth'
  | 'false_accusation'
  | 'insufficient_proof';

export interface AccusationResult {
  outcome: EndingOutcome;
  score: number;
  title: string;
  epilogue: string;
  breakdown: Array<{ label: string; correct: boolean; detail: string }>;
}

export interface SavedGameState {
  version: number;
  savedAt: string;
  currentLocation: LocationId;
  inventory: string[];
  discoveredLinks: string[];
  flags: StoryFlag[];
  visitedLocations: LocationId[];
  examinedHotspots: string[];
  talkedCharacters: CharacterId[];
  journal: JournalEntry[];
  boardPositions: Record<string, { x: number; y: number }>;
  playTimeSeconds: number;
}
