import { ClueItem } from '../../types/game';

export const CLUES: Record<string, ClueItem> = {
  edward_invitation: {
    id: 'edward_invitation',
    name: "Edward's Telegram",
    category: 'document',
    shortDesc: 'Summons from Edward Blackwood dated Nov 16, 1997.',
    description:
      'Crinkled Western Union telegram stained by rain along the fold. It reads: "COME TO BLACKWOOD MANOR BEFORE MIDNIGHT. I KNOW WHAT HAPPENED THAT NIGHT. YOU WERE WRONG ABOUT EVERYTHING. — E.B."',
    collectedAt: 'main_hall',
    collectedAtLabel: "Arthur's Coat Pocket",
    relevance: 'Explains why Edward summoned Detective Hayes—and suggests someone feared what Edward was about to confess.',
    imagePath: 'assets/objects/clues/edward_invitation.png',
    iconKind: 'telegram',
    boardTags: ['motive', '1992-case']
  },
  iron_poker: {
    id: 'iron_poker',
    name: 'Heavy Iron Poker',
    category: 'physical',
    shortDesc: 'Wrought-iron hearth poker from the Main Hall fireplace.',
    description:
      'A solid wrought-iron fire poker with a soot-darkened tip. Heavy enough to force a jammed Victorian mortise latch if wedged into the doorframe.',
    collectedAt: 'main_hall',
    collectedAtLabel: 'Main Hall Hearth',
    relevance: 'Useful for forcing open jammed doors—such as Edward’s locked study.',
    imagePath: 'assets/objects/clues/iron_poker.png',
    iconKind: 'poker',
    boardTags: ['tool']
  },
  broken_pocket_watch: {
    id: 'broken_pocket_watch',
    name: 'Shattered Pocket Watch',
    category: 'personal',
    shortDesc: 'Edward’s gold watch, crystal cracked and hands frozen at 11:32 PM.',
    description:
      'Found beneath Edward’s right elbow on the study rug. The glass face shattered upon impact with the desk corner. Both hands stand dead at 11:32 PM—fifteen minutes before the body was discovered.',
    collectedAt: 'study',
    collectedAtLabel: "Edward's Study",
    relevance: 'Establishes the true time of death at 11:32 PM, rather than 11:47 PM.',
    imagePath: 'assets/objects/clues/broken_pocket_watch.png',
    iconKind: 'watch',
    boardTags: ['timeline', '11:32']
  },
  brass_paperweight: {
    id: 'brass_paperweight',
    name: 'Brass Lion Paperweight',
    category: 'physical',
    shortDesc: 'Heavy desk ornament wiped poorly, with dried blood along its base.',
    description:
      'A three-pound cast-brass paperweight tucked behind the study hearth grate. Someone wiped the lion figure hastily, yet a dark reddish-brown smear and grey wool fibers remain trapped in the stamped base.',
    collectedAt: 'study',
    collectedAtLabel: "Edward's Study",
    relevance: 'The blunt-force murder weapon used to strike Edward at 11:32 PM.',
    imagePath: 'assets/objects/clues/brass_paperweight.png',
    iconKind: 'paperweight',
    boardTags: ['weapon']
  },
  laced_brandy_glass: {
    id: 'laced_brandy_glass',
    name: 'Sediment-Laced Brandy Glass',
    category: 'physical',
    shortDesc: 'Half-drunk snifter smelling faintly of bitter medicinal pear.',
    description:
      'Edward’s evening brandy snifter on the desk blotter. Swirling the amber liquid reveals chalky undissolved crystals at the bottom—carrying the unmistakable sweet-bitter tang of Chloral Hydrate.',
    collectedAt: 'study',
    collectedAtLabel: "Edward's Study",
    relevance: 'Edward was drugged before being struck so he could not resist his killer.',
    imagePath: 'assets/objects/clues/laced_brandy_glass.png',
    iconKind: 'glass',
    boardTags: ['sedative', 'method']
  },
  torn_threatening_note: {
    id: 'torn_threatening_note',
    name: 'Charred Threatening Note',
    category: 'document',
    shortDesc: 'Scorched note salvaged from the Billiard Room grate.',
    description:
      'Half-burned stationery in Edward’s jagged handwriting: "Forty thousand pounds in Soho gaming houses is your ruin, Thomas—not mine. By morning, your allowance ends permanently."',
    collectedAt: 'billiard_room',
    collectedAtLabel: 'Billiard Room Hearth',
    relevance: 'Proves Thomas had a bitter financial quarrel with Edward earlier tonight.',
    imagePath: 'assets/objects/clues/torn_threatening_note.png',
    iconKind: 'note',
    boardTags: ['thomas', 'red-herring']
  },
  eleanor_handkerchief: {
    id: 'eleanor_handkerchief',
    name: 'Monogrammed Silk Handkerchief',
    category: 'personal',
    shortDesc: 'Ivory silk embroidered "E.B.", dropped outside the study door.',
    description:
      'Tucked beside the oak wainscoting in the Upstairs Corridor, smelling faintly of French jasmine perfume. Eleanor swore she never left her bedroom after 10:30 PM.',
    collectedAt: 'upstairs_corridor',
    collectedAtLabel: 'Upstairs Corridor',
    relevance: 'Contradicts Eleanor’s alibi—she crept to the study door late at night.',
    imagePath: 'assets/objects/clues/eleanor_handkerchief.png',
    iconKind: 'handkerchief',
    boardTags: ['eleanor', 'alibi-break']
  },
  revised_will_draft: {
    id: 'revised_will_draft',
    name: 'Unsigned Revised Will',
    category: 'document',
    shortDesc: 'Draft codicil disinheriting Eleanor in favor of Clara and a trust.',
    description:
      'Retrieved from Edward’s study wall safe. Prepared by London solicitors on November 12, leaving Blackwood Manor solely to Clara and cutting Eleanor down to a modest stipend.',
    collectedAt: 'study',
    collectedAtLabel: "Edward's Study Safe",
    relevance: 'Explains Eleanor’s panic—she snuck down to steal or read this document, not to kill.',
    imagePath: 'assets/objects/clues/revised_will_draft.png',
    iconKind: 'will',
    boardTags: ['eleanor', 'motive']
  },
  falsified_ledger: {
    id: 'falsified_ledger',
    name: 'Doctored Shipping Ledger',
    category: 'document',
    shortDesc: 'Leather ledger from Victor Hale’s briefcase showing £120,000 missing.',
    description:
      'Double-entry ledger hidden inside Victor Hale’s Dining Room briefcase. Marginalia in red ink circled by Edward reads: "HALE EMBEZZLEMENT — CONFRONT TONIGHT."',
    collectedAt: 'dining_room',
    collectedAtLabel: 'Dining Room Sideboard',
    relevance: 'Gives Victor a strong financial motive, explaining why he lied at first.',
    imagePath: 'assets/objects/clues/falsified_ledger.png',
    iconKind: 'ledger',
    boardTags: ['victor', 'motive']
  },
  turkish_cigarette: {
    id: 'turkish_cigarette',
    name: 'Half-Smoked Turkish Cigarette',
    category: 'physical',
    shortDesc: 'Crushed under the Dining Room terrace door; ash blown inward.',
    description:
      'A gold-tipped Turkish cigarette—Victor Hale’s brand—wedged against the wet stone sill outside the terrace glass. Below the study bay window, fresh boot scuffs mark where someone stood out of the rain.',
    collectedAt: 'dining_room',
    collectedAtLabel: 'Dining Room Terrace Door',
    relevance: 'Corroborates Victor’s claim that he was smoking outside around 11:30 PM—and saw the study window.',
    imagePath: 'assets/objects/clues/turkish_cigarette.png',
    iconKind: 'cigarette',
    boardTags: ['victor', '11:32']
  },
  apothecary_key: {
    id: 'apothecary_key',
    name: 'Small Apothecary Key',
    category: 'key',
    shortDesc: 'Nickel-plated miniature key hidden inside the Guest Bedroom clock.',
    description:
      'Tucked behind the brass battery hatch of Dr. Reed’s travel alarm clock. Fits the recessed clasp on a physician’s Gladstone medical bag.',
    collectedAt: 'guest_bedroom',
    collectedAtLabel: 'Guest Bedroom Nightstand',
    relevance: 'Opens Dr. Reed’s locked medical bag.',
    imagePath: 'assets/objects/clues/apothecary_key.png',
    iconKind: 'key',
    boardTags: ['reed', 'tool']
  },
  guest_room_teacup: {
    id: 'guest_room_teacup',
    name: 'Stone-Cold Tea & Travel Clock',
    category: 'physical',
    shortDesc: 'Chamomile tea cold for over an hour; bedside clock faces the door.',
    description:
      'Dr. Reed claimed he was sipping hot tea and reading in the Guest Bedroom at 11:30 PM. Yet the porcelain cup is ice-cold with dried tannins along the rim, and his raincoat hangs damp on the hook.',
    collectedAt: 'guest_bedroom',
    collectedAtLabel: 'Guest Bedroom',
    relevance: 'Breaks Dr. Reed’s alibi—he was not sitting quietly in his bedroom at 11:30 PM.',
    imagePath: 'assets/objects/clues/guest_room_teacup.png',
    iconKind: 'teacup',
    boardTags: ['reed', 'alibi-break']
  },
  medical_bag_vial: {
    id: 'medical_bag_vial',
    name: 'Chloral Hydrate Bottle',
    category: 'physical',
    shortDesc: 'Amber bottle from Reed’s locked bag; 20ml missing from tonight’s seal.',
    description:
      'Inside Dr. Reed’s medical bag sits an amber bottle labeled "CHLORAL HYDRATE — KNOCKOUT SOLUTION". The wax seal was broken tonight, and a freshly wiped syringe lies wrapped in lint beside it.',
    collectedAt: 'guest_bedroom',
    collectedAtLabel: "Dr. Reed's Medical Bag",
    relevance: 'Directly links Dr. Reed to the sedative found in Edward’s brandy glass.',
    imagePath: 'assets/objects/clues/medical_bag_vial.png',
    iconKind: 'vial',
    boardTags: ['reed', 'sedative']
  },
  case_1992_dossier: {
    id: 'case_1992_dossier',
    name: '1992 Toxicology Dossier',
    category: 'document',
    shortDesc: 'Locked in Edward’s safe: proves Reed forged the 1992 autopsy report.',
    description:
      'Dated September 14, 1992—the very case that destroyed Arthur Hayes’s police career. Contains signed bank drafts from Edward Blackwood to Dr. Samuel Reed to falsify a witness’s toxicology report as "accidental overdose". Edward wrote: "Hayes was right. I am handing this to him tonight."',
    collectedAt: 'study',
    collectedAtLabel: "Edward's Study Safe",
    relevance: 'Establishes Dr. Reed’s desperate motive to silence Edward before Arthur arrived.',
    imagePath: 'assets/objects/clues/case_1992_dossier.png',
    iconKind: 'dossier',
    boardTags: ['reed', 'motive', '1992-case']
  },
  servant_passage_blueprint: {
    id: 'servant_passage_blueprint',
    name: '1920 Manor Blueprint',
    category: 'document',
    shortDesc: 'Faded architectural plan showing a concealed spiral stair.',
    description:
      'Pulled from the Library chart drawer. Red ink traces a 1920 service passage behind the Basement wine rack winding directly up inside the Study’s eastern bookcase.',
    collectedAt: 'library',
    collectedAtLabel: 'Library Map Cabinet',
    relevance: 'Explains how the killer could bolt the Study from inside and still escape unseen.',
    imagePath: 'assets/objects/clues/servant_passage_blueprint.png',
    iconKind: 'blueprint',
    boardTags: ['locked-room', 'basement']
  },
  coal_dust_footprints: {
    id: 'coal_dust_footprints',
    name: 'Coal-Dusted Boot Prints',
    category: 'photograph',
    shortDesc: 'Size 10 leather-sole prints leading up the secret basement stairs.',
    description:
      'Measured and sketched from the hidden stone steps behind the Basement wine rack. Narrow gentleman’s dress boots—matching the coal smudges on Dr. Reed’s polished oxfords.',
    collectedAt: 'basement',
    collectedAtLabel: 'Basement Secret Stair',
    relevance: 'Proves the culprit used the Basement passage after the murder.',
    imagePath: 'assets/objects/clues/coal_dust_footprints.png',
    iconKind: 'footprint',
    boardTags: ['reed', 'locked-room']
  },
  missing_study_key: {
    id: 'missing_study_key',
    name: 'Soot-Blackened Study Key',
    category: 'key',
    shortDesc: 'The missing brass mortise key for Edward’s study door.',
    description:
      'Fished from the dead ash grate inside the Basement coal furnace. Its bit matches the forced mortise lock on Edward’s study door—thrown down the ash chute during the killer’s escape.',
    collectedAt: 'basement',
    collectedAtLabel: 'Basement Coal Furnace',
    relevance: 'Proves the killer took the study key after locking the room and escaped via the Basement.',
    imagePath: 'assets/objects/clues/missing_study_key.png',
    iconKind: 'key',
    boardTags: ['locked-room', 'basement']
  },
  clara_sketchbook: {
    id: 'clara_sketchbook',
    name: "Clara's Charcoal Sketchbook",
    category: 'personal',
    shortDesc: 'A hurried sketch from 11:36 PM: spectacles glinting by the scullery sink.',
    description:
      'Found tucked in the Library reading nook. On the final page, drawn in frantic charcoal strokes, a tall man in wire-rimmed spectacles washes his cuffs at the downstairs basin beneath the words "11:36 — HE DIDN’T SEE ME."',
    collectedAt: 'library',
    collectedAtLabel: 'Library Reading Nook',
    relevance: 'Places Dr. Reed downstairs five minutes after the murder, washing soot and blood.',
    imagePath: 'assets/objects/clues/clara_sketchbook.png',
    iconKind: 'sketchbook',
    boardTags: ['reed', 'witness', '11:32']
  },
  damp_washcloth: {
    id: 'damp_washcloth',
    name: 'Soot-Stained Linen Towel',
    category: 'physical',
    shortDesc: 'Found beside the Kitchen scullery basin, damp with surgical soap and coal dust.',
    description:
      'Hanging crookedly beneath the Kitchen utility tap. Smells of carbolic physician’s soap mixed with black coal grime from the Basement stairs and a faint metallic rust stain.',
    collectedAt: 'kitchen',
    collectedAtLabel: 'Kitchen Scullery Basin',
    relevance: 'Confirms someone came straight up from the Basement coal passage to wash their hands.',
    imagePath: 'assets/objects/clues/damp_washcloth.png',
    iconKind: 'washcloth',
    boardTags: ['reed', 'basement']
  }
};

export const CLUE_LIST: ClueItem[] = Object.values(CLUES);
