import { EvidenceLinkDefinition } from '../../types/game';

export const EVIDENCE_LINKS: EvidenceLinkDefinition[] = [
  {
    id: 'link_sedative_murder',
    clueA: 'laced_brandy_glass',
    clueB: 'medical_bag_vial',
    title: 'Pharmacological Match',
    deductionText:
      'The chalky Chloral Hydrate crystals in Edward’s brandy snifter come directly from the freshly unsealed bottle inside Dr. Reed’s locked medical bag.',
    journalNote:
      'Deduction: Dr. Reed drugged Edward’s nightly brandy with Chloral Hydrate before the fatal blow.'
  },
  {
    id: 'link_true_time_of_death',
    clueA: 'broken_pocket_watch',
    clueB: 'turkish_cigarette',
    title: 'The 11:32 PM Window',
    deductionText:
      'Edward’s shattered pocket watch stopped at 11:32 PM—the exact moment Victor Hale saw the study desk lamp snap off from the terrace outside.',
    journalNote:
      'Deduction: Murder occurred at 11:32 PM, clearing Victor Hale and refuting the 11:47 PM timeline.'
  },
  {
    id: 'link_locked_room_escape',
    clueA: 'servant_passage_blueprint',
    clueB: 'missing_study_key',
    title: 'The Locked-Room Illusion',
    deductionText:
      'The killer locked the study door from inside, slipped through the 1920 secret staircase behind the bookcase to the Basement, and tossed the brass study key into the furnace ash.',
    journalNote:
      'Deduction: The hidden Basement stair explains how the killer escaped a locked room.'
  },
  {
    id: 'link_reed_basement_trail',
    clueA: 'coal_dust_footprints',
    clueB: 'damp_washcloth',
    title: 'Coal Soot & Carbolic Soap',
    deductionText:
      'Coal-dusted Size 10 dress-boot tracks climb the secret passage, and someone used surgical soap on the Kitchen basin towel minutes later to scrub off the soot.',
    journalNote:
      'Deduction: The culprit wore gentleman’s dress boots and carried surgical carbolic soap.'
  },
  {
    id: 'link_reed_witness_sighting',
    clueA: 'clara_sketchbook',
    clueB: 'guest_room_teacup',
    title: 'Shattered Medical Alibi',
    deductionText:
      'Clara sketched wire-rimmed spectacles downstairs at 11:36 PM while Dr. Reed’s tea in the Guest Bedroom had already gone stone-cold an hour earlier.',
    journalNote:
      'Deduction: Dr. Reed fabricated his Guest Bedroom alibi and was downstairs right after 11:32 PM.'
  },
  {
    id: 'link_1992_motive',
    clueA: 'edward_invitation',
    clueB: 'case_1992_dossier',
    title: 'The 1992 Conspiracy',
    deductionText:
      'Edward summoned Arthur to confess that he and Dr. Reed falsified the 1992 toxicology report. Reed killed Edward to prevent that dossier from reaching Arthur tonight.',
    journalNote:
      'Deduction: Dr. Reed’s motive was self-preservation over the forged 1992 toxicology dossier.'
  },
  {
    id: 'link_eleanor_secret',
    clueA: 'eleanor_handkerchief',
    clueB: 'revised_will_draft',
    title: 'Eleanor’s True Errand',
    deductionText:
      'Eleanor crept up to the study at 11:40 PM to inspect the revised will that cuts her out of the estate—only to find the door already locked from inside.',
    journalNote:
      'Deduction: Eleanor lied about sleeping, but her motive was the revised will, not murder.'
  }
];

export function findEvidenceLink(clueId1: string, clueId2: string): EvidenceLinkDefinition | undefined {
  return EVIDENCE_LINKS.find(
    (link) =>
      (link.clueA === clueId1 && link.clueB === clueId2) ||
      (link.clueA === clueId2 && link.clueB === clueId1)
  );
}
