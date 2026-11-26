import { AccusationInput, AccusationResult } from '../../types/game';

export const MOTIVE_OPTIONS = [
  {
    id: 'revised_will',
    label: 'To prevent Edward from signing the revised will disinheriting his family'
  },
  {
    id: 'embezzlement',
    label: 'To conceal £120,000 embezzled from Blackwood Industries'
  },
  {
    id: 'gambling_debts',
    label: 'Over £40,000 in Soho gambling debts and an allowance cutoff'
  },
  {
    id: '1992_dossier',
    label: 'To silence Edward before he gave Detective Hayes the forged 1992 toxicology dossier'
  }
];

export const METHOD_OPTIONS = [
  {
    id: 'poison_only',
    label: 'Fatal cyanide poisoning in a glass of chamomile tea'
  },
  {
    id: 'sedate_and_strike',
    label: 'Sedated Edward’s brandy with Chloral Hydrate, then struck him with the brass paperweight at 11:32 PM'
  },
  {
    id: 'fire_poker_ambush',
    label: 'Ambushed Edward from behind with the iron hall poker at 11:45 PM'
  },
  {
    id: 'terrace_shot',
    label: 'Climbed the terrace wall and struck Edward through the bay window'
  }
];

export const ALIBI_TRICK_OPTIONS = [
  {
    id: 'window_climb',
    label: 'Dropped from the study bay window down onto the dining terrace'
  },
  {
    id: 'secret_passage',
    label: 'Locked the study door, slipped down the 1920 secret bookcase stair to the Basement, and dumped the key in the furnace'
  },
  {
    id: 'duplicate_key',
    label: 'Left a false clock ticking in the hall and hid behind the Dining Room curtains'
  },
  {
    id: 'never_entered',
    label: 'Never entered the study—Edward killed himself after writing the note'
  }
];

const CORE_PROOF_IDS = [
  'medical_bag_vial',
  'case_1992_dossier',
  'broken_pocket_watch',
  'brass_paperweight',
  'laced_brandy_glass',
  'missing_study_key',
  'coal_dust_footprints',
  'clara_sketchbook',
  'servant_passage_blueprint',
  'damp_washcloth',
  'guest_room_teacup'
];

export function evaluateAccusation(
  input: AccusationInput,
  inventoryIds: string[],
  discoveredLinkIds: string[]
): AccusationResult {
  const culpritCorrect = input.culprit === 'reed';
  const motiveCorrect = input.motive === '1992_dossier';
  const methodCorrect = input.method === 'sedate_and_strike';
  const trickCorrect = input.alibiTrick === 'secret_passage';

  const validSelectedEvidence = input.evidenceIds.filter(
    (id) => inventoryIds.includes(id) && CORE_PROOF_IDS.includes(id)
  );
  const hasSmokingGun =
    input.evidenceIds.includes('medical_bag_vial') &&
    input.evidenceIds.includes('case_1992_dossier');
  const hasEscapeProof =
    input.evidenceIds.includes('missing_study_key') ||
    input.evidenceIds.includes('coal_dust_footprints') ||
    input.evidenceIds.includes('servant_passage_blueprint') ||
    input.evidenceIds.includes('clara_sketchbook');

  const evidenceScore = validSelectedEvidence.length;
  const linkBonus = discoveredLinkIds.length >= 3;

  const breakdown = [
    {
      label: 'Identified Culprit',
      correct: culpritCorrect,
      detail: culpritCorrect
        ? 'Dr. Samuel Reed — Edward’s personal physician.'
        : 'The real killer’s spectacles, medical bag, and coal-dusted boots pointed elsewhere.'
    },
    {
      label: 'True Motive',
      correct: motiveCorrect,
      detail: motiveCorrect
        ? 'Silencing Edward before he surrendered the forged 1992 toxicology dossier to Arthur Hayes.'
        : 'While other suspects held financial grievances, none matched the urgency of tonight’s midnight confession.'
    },
    {
      label: 'Murder Method & Time',
      correct: methodCorrect,
      detail: methodCorrect
        ? 'Chloral Hydrate in the 10:00 PM brandy followed by a blunt strike with the brass lion paperweight at 11:32 PM.'
        : 'The crystal fragments in the snifter, the stopped 11:32 PM watch, and the wiped paperweight told the exact physical sequence.'
    },
    {
      label: 'Alibi & Locked-Room Method',
      correct: trickCorrect,
      detail: trickCorrect
        ? 'Staged his cold tea and bed in the Guest Bedroom, bolted the study, escaped down the 1920 spiral stair to the Basement, and threw the key into the coal furnace.'
        : 'Only the 1920 secret staircase behind the study bookcase explains a bolted room with its mortise key missing.'
    },
    {
      label: 'Supporting Physical Proof',
      correct: hasSmokingGun && hasEscapeProof,
      detail:
        hasSmokingGun && hasEscapeProof
          ? `Presented ${evidenceScore} decisive exhibits linking motive, sedative, and escape.`
          : 'You lacked either the Chloral Hydrate + 1992 Dossier pairing or proof of the Basement escape route.'
    }
  ];

  const correctPillars = [culpritCorrect, motiveCorrect, methodCorrect, trickCorrect].filter(
    Boolean
  ).length;

  const score =
    correctPillars * 20 + Math.min(20, evidenceScore * 4 + (linkBonus ? 4 : 0));

  if (culpritCorrect && correctPillars === 4 && hasSmokingGun && hasEscapeProof) {
    return {
      outcome: 'true_justice',
      score,
      title: 'CASE SOLVED — THE LAST ALIBI SHATTERED',
      epilogue:
        'Silence falls over the Main Hall as you lay the unsealed Chloral Hydrate bottle beside the 1992 Miller Toxicology Dossier and the soot-blackened study key. Dr. Samuel Reed reaches slowly for his spectacles—his hand trembling for the first time all night. "You always were stubborn, Hayes," he whispers before Thomas and Victor bar the foyer doors until dawn. When the floodwaters recede at 6:14 AM, county detectives take Reed into custody—and clear Detective Arthur Hayes’s name after five long years in the wilderness.',
      breakdown
    };
  }

  if (culpritCorrect && (!hasSmokingGun || !hasEscapeProof || correctPillars < 4)) {
    return {
      outcome: 'insufficient_proof',
      score,
      title: 'INCOMPLETE CASE — REED SLIPS THE NOOSE',
      epilogue:
        'You name Dr. Samuel Reed before the gathered household—and his eyes flicker with sudden panic. Yet without every link in the chain (the 1992 dossier, the sedative match, and the Basement escape proof), Reed smoothly dismisses your reconstruction as a disgraced detective’s obsession. By the time county police reach Blackwood Manor at sunrise, Reed’s medical bag has vanished into the flooded quarry and the truth remains half-buried in doubt.',
      breakdown
    };
  }

  if (!culpritCorrect && correctPillars >= 2) {
    return {
      outcome: 'partial_truth',
      score,
      title: 'MISDIRECTED ACCUSATION — THE WRONG ARREST',
      epilogue:
        'You assemble several genuine clues from the storm-struck manor, yet your finger lands on an innocent suspect trapped in their own smaller lie. In the confusion of shouting voices, Dr. Samuel Reed quietly retreats upstairs to burn the last page of his ledger in the guest grate. An innocent Blackwood faces detention at dawn while the true killer drives back to London.',
      breakdown
    };
  }

  return {
    outcome: 'false_accusation',
    score,
    title: 'WRONGFUL ACCUSATION — JUSTICE DENIED',
    epilogue:
      'Your accusation rings hollow across the oak hall. Every contradiction in your theory crumbles under cross-questioning, and the family closes ranks against you. At daybreak, you walk down the flooded gravel drive empty-handed—knowing Edward Blackwood’s killer walked free behind wire-rimmed spectacles.',
    breakdown
  };
}
