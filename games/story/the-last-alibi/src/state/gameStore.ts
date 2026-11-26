import {
  AccusationInput,
  AccusationResult,
  AudioSettings,
  CharacterId,
  JournalEntry,
  LocationId,
  SavedGameState,
  StoryFlag
} from '../types/game';
import { CLUES } from '../data/clues/clues';
import { CHARACTERS } from '../data/characters/characters';
import { LOCATIONS } from '../data/locations/locations';
import { findEvidenceLink } from '../data/evidence/links';
import { evaluateAccusation } from '../data/story/mystery';

const SAVE_KEY = 'the_last_alibi_save_v1';
const SETTINGS_KEY = 'the_last_alibi_settings_v1';

export type ModalKind =
  | 'none'
  | 'inventory'
  | 'journal'
  | 'evidence_board'
  | 'deduction'
  | 'settings'
  | 'credits';

export interface ActiveInspection {
  title: string;
  body: string;
  clueId?: string;
  isDiscoveryCutscene?: boolean;
}

export interface ActiveDialogue {
  characterId: CharacterId;
  nodeId: string;
  customResponseText?: string;
}

export interface GameRuntimeState {
  screen: 'menu' | 'playing' | 'ending';
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

  // UI Overlays
  openModal: ModalKind;
  selectedInventoryClueId: string | null;
  activeInspection: ActiveInspection | null;
  activeDialogue: ActiveDialogue | null;
  activePuzzle: 'force_study_door' | 'study_safe' | 'medical_bag' | 'wine_lever' | null;
  hoverHint: { label: string; actionType: string } | null;
  toast: { id: number; title: string; body: string } | null;
  endingResult: AccusationResult | null;
  audioSettings: AudioSettings;
}

function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      return {
        masterVolume: parsed.masterVolume ?? 0.75,
        musicVolume: parsed.musicVolume ?? 0.55,
        sfxVolume: parsed.sfxVolume ?? 0.8,
        muted: parsed.muted ?? false
      };
    }
  } catch {
    // ignore storage failures
  }
  return {
    masterVolume: 0.75,
    musicVolume: 0.55,
    sfxVolume: 0.8,
    muted: false
  };
}

function createInitialJournal(): JournalEntry[] {
  return [
    {
      id: 'j_arrival',
      timestamp: '11:45 PM',
      category: 'timeline',
      title: 'Summoned to Blackwood Manor',
      body: 'Rain floods the moorland road and telephone lines hang dead. You arrived carrying Edward Blackwood’s telegram: "I know what happened that night. You were wrong about everything." Upstairs, Thomas Blackwood is shouting outside a locked study door.'
    },
    {
      id: 'j_q_locked',
      timestamp: '11:47 PM',
      category: 'question',
      title: 'Unresolved: What happened behind the Study door?',
      body: 'Edward has not answered since 11:15 PM. Find something heavy—like the hearth iron poker in the Main Hall—and force the Upstairs Study door.'
    }
  ];
}

function createFreshState(screen: 'menu' | 'playing'): GameRuntimeState {
  return {
    screen,
    currentLocation: 'main_hall',
    inventory: ['edward_invitation'],
    discoveredLinks: [],
    flags: ['arrived_manor'],
    visitedLocations: ['main_hall'],
    examinedHotspots: [],
    talkedCharacters: [],
    journal: createInitialJournal(),
    boardPositions: {},
    playTimeSeconds: 0,
    openModal: 'none',
    selectedInventoryClueId: 'edward_invitation',
    activeInspection:
      screen === 'playing'
        ? {
            title: 'Blackwood Manor — November 17, 1997 (11:45 PM)',
            body: 'Lightning forks above the English moor as you step out of the storm into the Main Hall. Six people are trapped inside tonight. Upstairs, Thomas Blackwood is hammering on Edward’s locked study door. Search the hall—grab the heavy iron poker by the hearth if you need to force the lock.'
          }
        : null,
    activeDialogue: null,
    activePuzzle: null,
    hoverHint: null,
    toast: null,
    endingResult: null,
    audioSettings: loadAudioSettings()
  };
}

type Listener = () => void;

class GameStore {
  private state: GameRuntimeState = createFreshState('menu');
  private listeners = new Set<Listener>();
  private toastCounter = 0;

  getState = (): GameRuntimeState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private update(patch: Partial<GameRuntimeState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  hasSavedGame(): boolean {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  startNewGame() {
    this.state = createFreshState('playing');
    this.saveGame(true);
    this.emit();
  }

  continueGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as SavedGameState;
      this.state = {
        ...createFreshState('playing'),
        currentLocation: saved.currentLocation,
        inventory: saved.inventory,
        discoveredLinks: saved.discoveredLinks,
        flags: saved.flags,
        visitedLocations: saved.visitedLocations,
        examinedHotspots: saved.examinedHotspots,
        talkedCharacters: saved.talkedCharacters,
        journal: saved.journal,
        boardPositions: saved.boardPositions || {},
        playTimeSeconds: saved.playTimeSeconds || 0,
        activeInspection: null
      };
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  saveGame(silent = false) {
    try {
      const payload: SavedGameState = {
        version: 1,
        savedAt: new Date().toISOString(),
        currentLocation: this.state.currentLocation,
        inventory: this.state.inventory,
        discoveredLinks: this.state.discoveredLinks,
        flags: this.state.flags,
        visitedLocations: this.state.visitedLocations,
        examinedHotspots: this.state.examinedHotspots,
        talkedCharacters: this.state.talkedCharacters,
        journal: this.state.journal,
        boardPositions: this.state.boardPositions,
        playTimeSeconds: this.state.playTimeSeconds
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      if (!silent) {
        this.showToast('Case File Saved', 'Progress recorded to local ledger.');
      }
    } catch {
      if (!silent) {
        this.showToast('Save Warning', 'Could not write save data to browser storage.');
      }
    }
  }

  returnToMainMenu() {
    this.saveGame(true);
    this.update({
      screen: 'menu',
      openModal: 'none',
      activeInspection: null,
      activeDialogue: null,
      activePuzzle: null
    });
  }

  tickPlayTime(seconds = 1) {
    if (this.state.screen === 'playing') {
      this.state = { ...this.state, playTimeSeconds: this.state.playTimeSeconds + seconds };
    }
  }

  setHoverHint(hoverHint: { label: string; actionType: string } | null) {
    const prev = this.state.hoverHint;
    if (prev?.label === hoverHint?.label && prev?.actionType === hoverHint?.actionType) return;
    this.update({ hoverHint });
  }

  showToast(title: string, body: string) {
    const id = ++this.toastCounter;
    this.update({ toast: { id, title, body } });
    window.setTimeout(() => {
      if (this.state.toast?.id === id) {
        this.update({ toast: null });
      }
    }, 4200);
  }

  setModal(openModal: ModalKind) {
    this.update({
      openModal,
      activeInspection: openModal !== 'none' ? null : this.state.activeInspection
    });
  }

  selectInventoryClue(clueId: string) {
    this.update({ selectedInventoryClueId: clueId });
  }

  closeInspection() {
    this.update({ activeInspection: null });
  }

  openInspection(inspection: ActiveInspection) {
    this.update({ activeInspection: inspection });
  }

  hasFlag(flag: StoryFlag): boolean {
    return this.state.flags.includes(flag);
  }

  addFlag(flag: StoryFlag) {
    if (!this.state.flags.includes(flag)) {
      this.update({ flags: [...this.state.flags, flag] });
      this.saveGame(true);
    }
  }

  addJournalEntry(entry: Omit<JournalEntry, 'timestamp'> & { timestamp?: string }) {
    if (this.state.journal.some((j) => j.id === entry.id)) return;
    const timestamp = entry.timestamp ?? this.formatCaseClock();
    this.update({
      journal: [{ ...entry, timestamp }, ...this.state.journal]
    });
  }

  private formatCaseClock(): string {
    const mins = Math.min(59, 47 + Math.floor(this.state.playTimeSeconds / 45));
    if (mins < 60) return `11:${String(mins).padStart(2, '0')} PM`;
    return '12:04 AM';
  }

  collectClue(clueId: string): boolean {
    if (this.state.inventory.includes(clueId)) return false;
    const clue = CLUES[clueId];
    if (!clue) return false;

    const index = this.state.inventory.length;
    const defaultPos = {
      x: 70 + (index % 4) * 215,
      y: 65 + Math.floor(index / 4) * 145
    };

    const nextJournal: JournalEntry[] = this.state.journal.some((j) => j.id === `clue_${clueId}`)
      ? this.state.journal
      : [
          {
            id: `clue_${clueId}`,
            timestamp: this.formatCaseClock(),
            category: 'clue',
            title: `Evidence Collected: ${clue.name}`,
            body: `${clue.shortDesc} (${clue.collectedAtLabel})`
          },
          ...this.state.journal
        ];

    this.update({
      inventory: [...this.state.inventory, clueId],
      selectedInventoryClueId: clueId,
      boardPositions: {
        ...this.state.boardPositions,
        [clueId]: this.state.boardPositions[clueId] || defaultPos
      },
      journal: nextJournal
    });

    this.showToast('Evidence Added', clue.name);
    this.saveGame(true);
    return true;
  }

  moveToLocation(locationId: LocationId) {
    if (locationId === 'study' && !this.hasFlag('murder_discovered')) {
      this.update({ activePuzzle: 'force_study_door' });
      return;
    }

    const loc = LOCATIONS[locationId];
    const visited = this.state.visitedLocations.includes(locationId)
      ? this.state.visitedLocations
      : [...this.state.visitedLocations, locationId];

    this.update({
      currentLocation: locationId,
      visitedLocations: visited,
      activeInspection: null,
      activeDialogue: null,
      activePuzzle: null,
      hoverHint: null
    });

    this.showToast(loc.name, loc.subtitle);
    this.saveGame(true);
  }

  markHotspotExamined(hotspotId: string) {
    if (!this.state.examinedHotspots.includes(hotspotId)) {
      this.update({ examinedHotspots: [...this.state.examinedHotspots, hotspotId] });
    }
  }

  handleHotspotInteraction(hotspotId: string) {
    const loc = LOCATIONS[this.state.currentLocation];
    const hotspot = loc.hotspots.find((h) => h.id === hotspotId);
    if (!hotspot) return;

    this.markHotspotExamined(hotspotId);

    if (hotspot.puzzleId) {
      if (hotspot.puzzleId === 'force_study_door' && this.hasFlag('murder_discovered')) {
        this.moveToLocation('study');
        return;
      }
      if (hotspot.puzzleId === 'study_safe' && this.hasFlag('study_safe_opened')) {
        this.openInspection({
          title: hotspot.inspectTitle,
          body: hotspot.alreadyDoneText || hotspot.inspectText
        });
        return;
      }
      if (hotspot.puzzleId === 'medical_bag' && this.hasFlag('medical_bag_opened')) {
        this.openInspection({
          title: hotspot.inspectTitle,
          body: hotspot.alreadyDoneText || hotspot.inspectText
        });
        return;
      }
      if (hotspot.puzzleId === 'wine_lever' && this.hasFlag('secret_passage_found')) {
        this.openInspection({
          title: hotspot.inspectTitle,
          body: hotspot.alreadyDoneText || hotspot.inspectText
        });
        return;
      }
      this.update({ activePuzzle: hotspot.puzzleId, activeInspection: null });
      return;
    }

    if (hotspot.type === 'move' && hotspot.targetLocation) {
      this.moveToLocation(hotspot.targetLocation);
      return;
    }

    if (hotspot.type === 'talk' && hotspot.characterId) {
      this.startDialogue(hotspot.characterId);
      return;
    }

    if (hotspot.type === 'collect' && hotspot.collectClueId) {
      const alreadyHas = this.state.inventory.includes(hotspot.collectClueId);
      if (alreadyHas) {
        this.openInspection({
          title: hotspot.inspectTitle,
          body: hotspot.alreadyDoneText || hotspot.inspectText
        });
      } else {
        this.collectClue(hotspot.collectClueId);
        this.openInspection({
          title: hotspot.inspectTitle,
          body: hotspot.inspectText,
          clueId: hotspot.collectClueId
        });
      }
      return;
    }

    if (hotspot.id === 'st_edward_body') {
      this.addFlag('examined_body');
      this.addJournalEntry({
        id: 'j_examined_body',
        category: 'timeline',
        title: 'Cause of Death Observation',
        body: 'Edward suffered a single skull fracture with zero defensive wounds—strongly implying prior sedation.'
      });
    }

    this.openInspection({
      title: hotspot.inspectTitle,
      body: hotspot.inspectText
    });
  }

  solveForceStudyDoor() {
    this.addFlag('murder_discovered');
    this.update({
      activePuzzle: null,
      currentLocation: 'study',
      visitedLocations: this.state.visitedLocations.includes('study')
        ? this.state.visitedLocations
        : [...this.state.visitedLocations, 'study'],
      activeInspection: {
        title: '11:47 PM — MURDER IN THE LOCKED STUDY',
        body: 'With a crack of oak splintering beneath the iron poker, the study door flies inward. Rain hammers the bay window. Across the mahogany desk, Edward Blackwood lies dead beside an overturned brass lamp—skull fractured, brandy glass half-full, and no brass key in the lock. Nobody could have walked past the gallery stairs. Someone is lying about where they were tonight.',
        isDiscoveryCutscene: true
      }
    });

    this.addJournalEntry({
      id: 'j_murder_discovered',
      timestamp: '11:47 PM',
      category: 'timeline',
      title: 'Body of Edward Blackwood Discovered',
      body: 'Forced the bolted Study door at 11:47 PM. Edward Blackwood was found dead at his desk, door bolted, brass key missing from the lock.'
    });
    this.saveGame(true);
  }

  solveStudySafe(code: string): boolean {
    const cleaned = code.replace(/[^0-9]/g, '');
    if (cleaned !== '140992') return false;

    this.addFlag('study_safe_opened');
    this.collectClue('case_1992_dossier');
    this.collectClue('revised_will_draft');
    this.update({
      activePuzzle: null,
      activeInspection: {
        title: 'Study Wall Safe Unlocked (14-09-92)',
        body: 'The steel tumblers click open. Inside lie two explosive documents: the unsigned 1997 Revised Will cutting Eleanor out of the manor, and the secret 1992 Toxicology Dossier signed by Dr. Samuel Reed.',
        clueId: 'case_1992_dossier'
      }
    });
    this.saveGame(true);
    return true;
  }

  unlockMedicalBag(): boolean {
    if (!this.state.inventory.includes('apothecary_key')) return false;
    this.addFlag('medical_bag_opened');
    this.collectClue('medical_bag_vial');
    this.update({
      activePuzzle: null,
      activeInspection: {
        title: "Dr. Reed's Medical Bag Unlatched",
        body: 'The miniature apothecary key turns cleanly. Inside rests a freshly unsealed bottle of Chloral Hydrate—20 milliliters missing—and a wiped syringe wrapped in surgical lint.',
        clueId: 'medical_bag_vial'
      }
    });
    this.saveGame(true);
    return true;
  }

  pullWineRackLever() {
    this.addFlag('secret_passage_found');
    this.update({
      activePuzzle: null,
      activeInspection: {
        title: 'Hidden 1920 Spiral Staircase Revealed!',
        body: 'Iron counterweights groan behind the damp limestone. The dusty wine rack swings inward, exposing a narrow stone spiral stair ascending straight up behind Edward’s Study bookcase—dusted with fresh size-10 coal footprints!',
        isDiscoveryCutscene: true
      }
    });
    this.addJournalEntry({
      id: 'j_secret_stair',
      category: 'clue',
      title: 'Secret Passage Uncovered',
      body: 'Pulled the Basement wine-rack sconce to uncover the 1920 spiral stair linking the Basement directly to Edward’s Study.'
    });
    this.saveGame(true);
  }

  closePuzzle() {
    this.update({ activePuzzle: null });
  }

  startDialogue(characterId: CharacterId) {
    const char = CHARACTERS[characterId];
    if (!char) return;
    const talked = this.state.talkedCharacters.includes(characterId)
      ? this.state.talkedCharacters
      : [...this.state.talkedCharacters, characterId];
    this.update({
      talkedCharacters: talked,
      activeInspection: null,
      activeDialogue: {
        characterId,
        nodeId: char.rootNodeId
      }
    });
  }

  chooseDialogueOption(choiceId: string) {
    const dlg = this.state.activeDialogue;
    if (!dlg) return;
    const char = CHARACTERS[dlg.characterId];
    const node = char.nodes[dlg.nodeId];
    if (!node) return;
    const choice = node.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    if (choice.nextNodeId === 'EXIT') {
      this.update({ activeDialogue: null });
      return;
    }

    const nextNode = char.nodes[choice.nextNodeId];
    if (!nextNode) {
      this.update({ activeDialogue: null });
      return;
    }

    if (nextNode.setsFlag) this.addFlag(nextNode.setsFlag);
    if (nextNode.grantsClueId) this.collectClue(nextNode.grantsClueId);
    if (nextNode.journalEntry) {
      this.addJournalEntry(nextNode.journalEntry);
    }

    this.update({
      activeDialogue: {
        characterId: dlg.characterId,
        nodeId: nextNode.id,
        customResponseText: undefined
      }
    });
    this.saveGame(true);
  }

  presentEvidenceInDialogue(clueId: string) {
    const dlg = this.state.activeDialogue;
    if (!dlg) return;
    const char = CHARACTERS[dlg.characterId];
    const reaction = char.presentReactions[clueId];
    if (reaction) {
      if (reaction.setsFlag) this.addFlag(reaction.setsFlag);
      if (reaction.journalTitle && reaction.journalBody) {
        this.addJournalEntry({
          id: `present_${dlg.characterId}_${clueId}`,
          category: 'conversation',
          title: reaction.journalTitle,
          body: reaction.journalBody
        });
      }
      this.update({
        activeDialogue: {
          ...dlg,
          customResponseText: reaction.text
        }
      });
      this.saveGame(true);
    } else {
      this.update({
        activeDialogue: {
          ...dlg,
          customResponseText: char.defaultPresentReaction
        }
      });
    }
  }

  closeDialogue() {
    this.update({ activeDialogue: null });
  }

  updateBoardPosition(clueId: string, x: number, y: number) {
    this.update({
      boardPositions: {
        ...this.state.boardPositions,
        [clueId]: { x, y }
      }
    });
  }

  attemptEvidenceLink(clueId1: string, clueId2: string): {
    success: boolean;
    alreadyFound?: boolean;
    title: string;
    message: string;
  } {
    if (clueId1 === clueId2) {
      return {
        success: false,
        title: 'Same Exhibit',
        message: 'Select two different exhibits to test a connection.'
      };
    }

    const link = findEvidenceLink(clueId1, clueId2);
    if (!link) {
      return {
        success: false,
        title: 'No Direct Link',
        message:
          'Those two items do not form a decisive forensic contradiction on their own. Look for matching times, substances, or physical locations.'
      };
    }

    if (this.state.discoveredLinks.includes(link.id)) {
      return {
        success: true,
        alreadyFound: true,
        title: link.title,
        message: link.deductionText
      };
    }

    this.update({
      discoveredLinks: [...this.state.discoveredLinks, link.id]
    });
    this.addJournalEntry({
      id: `ded_${link.id}`,
      category: 'deduction',
      title: `Deduction: ${link.title}`,
      body: link.journalNote
    });
    this.showToast(`Deduction Linked: ${link.title}`, link.journalNote);
    this.saveGame(true);

    return {
      success: true,
      title: link.title,
      message: link.deductionText
    };
  }

  submitAccusation(input: AccusationInput): AccusationResult {
    const result = evaluateAccusation(input, this.state.inventory, this.state.discoveredLinks);
    this.addFlag('case_closed');
    this.update({
      openModal: 'none',
      endingResult: result,
      screen: 'ending'
    });
    return result;
  }

  updateAudioSettings(patch: Partial<AudioSettings>) {
    const next = { ...this.state.audioSettings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    this.update({ audioSettings: next });
  }
}

export const gameStore = new GameStore();
