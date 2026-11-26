import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser globals needed by gameStore before importing modules
const storageMap = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => {
    storageMap.set(k, String(v));
  },
  removeItem: (k: string) => {
    storageMap.delete(k);
  },
  clear: () => storageMap.clear(),
  key: (idx: number) => Array.from(storageMap.keys())[idx] ?? null,
  get length() {
    return storageMap.size;
  }
};
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;

import { CHARACTERS, CHARACTER_LIST } from '../src/data/characters/characters';
import { CLUES } from '../src/data/clues/clues';
import { EVIDENCE_LINKS } from '../src/data/evidence/links';
import { LOCATIONS, LOCATION_LIST } from '../src/data/locations/locations';
import { gameStore } from '../src/state/gameStore';

test('World graph integrity: all 9 rooms, valid exits, valid clues & character links', () => {
  assert.equal(LOCATION_LIST.length, 9, 'Should have all 9 Blackwood Manor locations');
  assert.equal(CHARACTER_LIST.length, 6, 'Should have all 6 suspects');

  for (const loc of LOCATION_LIST) {
    assert.ok(loc.hotspots.length >= 4, `${loc.id} should have at least 4 hotspots`);
    for (const ex of loc.exits) {
      assert.ok(LOCATIONS[ex.locationId], `Exit target ${ex.locationId} missing`);
    }
    for (const hp of loc.hotspots) {
      if (hp.targetLocation) {
        assert.ok(LOCATIONS[hp.targetLocation], `Hotspot target ${hp.targetLocation} missing`);
      }
      if (hp.collectClueId) {
        assert.ok(CLUES[hp.collectClueId], `Clue ${hp.collectClueId} missing`);
      }
      if (hp.characterId) {
        assert.ok(CHARACTERS[hp.characterId], `Character ${hp.characterId} missing`);
      }
    }
  }

  for (const char of CHARACTER_LIST) {
    assert.ok(char.nodes[char.rootNodeId], `${char.id} missing root node`);
    for (const node of Object.values(char.nodes)) {
      for (const ch of node.choices) {
        if (ch.nextNodeId !== 'EXIT') {
          assert.ok(
            char.nodes[ch.nextNodeId],
            `${char.id} choice ${ch.id} references missing node ${ch.nextNodeId}`
          );
        }
        if (ch.requiredClueId) {
          assert.ok(CLUES[ch.requiredClueId], `Choice gate clue ${ch.requiredClueId} missing`);
        }
      }
    }
  }

  for (const link of EVIDENCE_LINKS) {
    assert.ok(CLUES[link.clueA], `Link ${link.id} clueA missing`);
    assert.ok(CLUES[link.clueB], `Link ${link.id} clueB missing`);
  }
});

test('Full mystery playthrough: exploration, puzzles, evidence board, save/load & all endings', () => {
  storageMap.clear();
  gameStore.startNewGame();

  let st = gameStore.getState();
  assert.equal(st.screen, 'playing');
  assert.equal(st.currentLocation, 'main_hall');
  assert.ok(st.inventory.includes('edward_invitation'));

  // Collect iron poker in Main Hall
  gameStore.handleHotspotInteraction('mh_fireplace_poker');
  assert.ok(gameStore.getState().inventory.includes('iron_poker'));

  // Move to Upstairs Corridor and try entering study -> triggers locked door puzzle
  gameStore.moveToLocation('upstairs_corridor');
  assert.equal(gameStore.getState().currentLocation, 'upstairs_corridor');
  gameStore.moveToLocation('study');
  assert.equal(gameStore.getState().activePuzzle, 'force_study_door');

  // Force the door -> Murder Discovery Sequence!
  gameStore.solveForceStudyDoor();
  st = gameStore.getState();
  assert.equal(st.currentLocation, 'study');
  assert.ok(st.flags.includes('murder_discovered'));

  // Collect study clues & solve safe (wrong code rejected, 140992 accepted)
  gameStore.handleHotspotInteraction('st_pocket_watch');
  gameStore.handleHotspotInteraction('st_brandy_glass');
  gameStore.handleHotspotInteraction('st_paperweight');
  assert.equal(gameStore.solveStudySafe('000000'), false);
  assert.equal(gameStore.solveStudySafe('140992'), true);
  st = gameStore.getState();
  assert.ok(st.inventory.includes('case_1992_dossier'));
  assert.ok(st.inventory.includes('revised_will_draft'));

  // Library clues & Clara dialogue
  gameStore.moveToLocation('library');
  gameStore.handleHotspotInteraction('lib_map_cabinet');
  gameStore.handleHotspotInteraction('lib_sketchbook');
  gameStore.startDialogue('clara');
  gameStore.presentEvidenceInDialogue('clara_sketchbook');
  assert.ok(gameStore.getState().flags.includes('confronted_clara'));
  gameStore.closeDialogue();

  // Dining Room & Kitchen clues
  gameStore.moveToLocation('dining_room');
  gameStore.handleHotspotInteraction('dr_terrace_cigarette');
  gameStore.moveToLocation('kitchen');
  gameStore.handleHotspotInteraction('kt_washbasin_towel');

  // Guest Bedroom: apothecary key & medical bag puzzle
  gameStore.moveToLocation('guest_bedroom');
  gameStore.handleHotspotInteraction('gb_nightstand_clock');
  gameStore.handleHotspotInteraction('gb_apothecary_key');
  assert.equal(gameStore.unlockMedicalBag(), true);
  assert.ok(gameStore.getState().inventory.includes('medical_bag_vial'));

  // Basement secret passage & furnace key
  gameStore.moveToLocation('basement');
  gameStore.pullWineRackLever();
  assert.ok(gameStore.getState().flags.includes('secret_passage_found'));
  gameStore.handleHotspotInteraction('bs_coal_furnace');
  gameStore.handleHotspotInteraction('bs_boot_prints');
  assert.ok(gameStore.getState().inventory.includes('missing_study_key'));
  assert.ok(gameStore.getState().inventory.includes('coal_dust_footprints'));

  // Evidence Board links (positive & negative)
  const badLink = gameStore.attemptEvidenceLink('edward_invitation', 'turkish_cigarette');
  assert.equal(badLink.success, false);

  const link1 = gameStore.attemptEvidenceLink('laced_brandy_glass', 'medical_bag_vial');
  const link2 = gameStore.attemptEvidenceLink('edward_invitation', 'case_1992_dossier');
  const link3 = gameStore.attemptEvidenceLink('servant_passage_blueprint', 'missing_study_key');
  assert.equal(link1.success, true);
  assert.equal(link2.success, true);
  assert.equal(link3.success, true);

  // Save & Continue round-trip
  gameStore.saveGame(true);
  const invBeforeSave = [...gameStore.getState().inventory];
  gameStore.returnToMainMenu();
  assert.equal(gameStore.getState().screen, 'menu');
  assert.equal(gameStore.continueGame(), true);
  assert.deepEqual(gameStore.getState().inventory, invBeforeSave);

  // Insufficient proof outcome (right culprit, missing dossier & escape proof)
  const insuff = gameStore.submitAccusation({
    culprit: 'reed',
    motive: '1992_dossier',
    method: 'sedate_and_strike',
    alibiTrick: 'secret_passage',
    evidenceIds: ['broken_pocket_watch', 'brass_paperweight']
  });
  assert.equal(insuff.outcome, 'insufficient_proof');

  // Wrong suspect outcome
  gameStore.continueGame();
  const wrong = gameStore.submitAccusation({
    culprit: 'eleanor',
    motive: 'revised_will',
    method: 'fire_poker_ambush',
    alibiTrick: 'duplicate_key',
    evidenceIds: ['eleanor_handkerchief', 'revised_will_draft']
  });
  assert.equal(wrong.outcome, 'false_accusation');

  // True Justice outcome
  gameStore.continueGame();
  const solved = gameStore.submitAccusation({
    culprit: 'reed',
    motive: '1992_dossier',
    method: 'sedate_and_strike',
    alibiTrick: 'secret_passage',
    evidenceIds: [
      'medical_bag_vial',
      'case_1992_dossier',
      'broken_pocket_watch',
      'missing_study_key',
      'coal_dust_footprints'
    ]
  });
  assert.equal(solved.outcome, 'true_justice');
  assert.equal(solved.score, 100);
});
