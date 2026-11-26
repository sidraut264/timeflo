import { LocationDefinition, LocationId } from '../../types/game';

export const LOCATIONS: Record<LocationId, LocationDefinition> = {
  main_hall: {
    id: 'main_hall',
    name: 'Main Hall',
    subtitle: 'Blackwood Manor — Ground Foyer, 11:47 PM',
    ambientDesc:
      'Rain lashes the stained-glass lancets above the grand staircase. A bronze grandfather clock ticks heavily over wet stone flags while thunder shakes the oak rafters.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'mansion',
    palette: {
      skyTop: '#0d1521',
      skyBottom: '#1c2a3a',
      farWall: '#1f1713',
      midWall: '#2b1e16',
      floor: '#17110d',
      trim: '#463222',
      lampGlow: '#c99746',
      accent: '#5a1e24'
    },
    audio: {
      baseDroneHz: 55,
      rainIntensity: 0.72,
      thunderChance: 0.35,
      tickingClock: true,
      fireplace: true,
      creaks: true,
      drip: false
    },
    exits: [
      { locationId: 'library', label: 'Library', direction: 'left' },
      { locationId: 'dining_room', label: 'Dining Room', direction: 'right' },
      { locationId: 'billiard_room', label: 'Billiard Room', direction: 'door' },
      { locationId: 'kitchen', label: 'Kitchen', direction: 'door' },
      { locationId: 'upstairs_corridor', label: 'Upstairs Corridor', direction: 'up' }
    ],
    hotspots: [
      {
        id: 'mh_door_library',
        label: 'Enter Library',
        type: 'move',
        x: 115,
        y: 385,
        width: 115,
        height: 255,
        depthLayer: 'midground',
        targetLocation: 'library',
        inspectTitle: 'West Archway — Library',
        inspectText: 'Tall walnut doors stand slightly ajar into the quiet Library.',
        visualKind: 'arch_door'
      },
      {
        id: 'mh_grandfather_clock',
        label: 'Grandfather Clock',
        type: 'examine',
        x: 345,
        y: 350,
        width: 95,
        height: 290,
        depthLayer: 'midground',
        inspectTitle: '19th-Century Longcase Clock',
        inspectText:
          'Its brass pendulum swings steadily: 11:48 PM. When Margaret summoned everyone into the hall moments ago, it struck quarter to midnight—yet the upper corridor has been silent for half an hour.',
        visualKind: 'grandfather_clock'
      },
      {
        id: 'mh_telephone_table',
        label: 'Dead Telephone Line',
        type: 'examine',
        x: 520,
        y: 445,
        width: 110,
        height: 115,
        depthLayer: 'midground',
        inspectTitle: 'Bakelite Hall Telephone',
        inspectText:
          'You lift the heavy receiver. Only static and wind-whipped wire hum back at you. No police from the village until the floodwater recedes or the line is mended.',
        visualKind: 'telephone'
      },
      {
        id: 'mh_fireplace_poker',
        label: 'Heavy Iron Poker',
        type: 'collect',
        x: 685,
        y: 445,
        width: 120,
        height: 170,
        depthLayer: 'midground',
        collectClueId: 'iron_poker',
        inspectTitle: 'Main Hall Hearth & Iron Poker',
        inspectText:
          'Dying peat embers glow behind a wrought-iron fender. Hanging beside the stone mantel is a heavy iron poker—solid enough to pry open a bolted Victorian latch.',
        alreadyDoneText: 'Only low red embers remain inside the limestone hearth.',
        visualKind: 'fireplace'
      },
      {
        id: 'mh_stairs_up',
        label: 'Ascend Grand Staircase',
        type: 'move',
        x: 880,
        y: 300,
        width: 195,
        height: 270,
        depthLayer: 'midground',
        targetLocation: 'upstairs_corridor',
        inspectTitle: 'Grand Oak Staircase',
        inspectText: 'Leads up to the Upstairs Corridor, Edward’s Study, and the Guest Bedroom.',
        visualKind: 'staircase'
      },
      {
        id: 'mh_door_billiard',
        label: 'Enter Billiard Room',
        type: 'move',
        x: 1155,
        y: 385,
        width: 100,
        height: 235,
        depthLayer: 'midground',
        targetLocation: 'billiard_room',
        inspectTitle: 'Billiard Room Door',
        inspectText: 'Warm green lamplight spills from under the door.',
        visualKind: 'paneled_door'
      },
      {
        id: 'mh_door_kitchen',
        label: 'Enter Kitchen',
        type: 'move',
        x: 1300,
        y: 395,
        width: 95,
        height: 225,
        depthLayer: 'midground',
        targetLocation: 'kitchen',
        inspectTitle: 'Servants’ Baize Door — Kitchen',
        inspectText: 'Green baize swinging door leading into the scullery and Kitchen.',
        visualKind: 'baize_door'
      },
      {
        id: 'mh_door_dining',
        label: 'Enter Dining Room',
        type: 'move',
        x: 1465,
        y: 385,
        width: 110,
        height: 255,
        depthLayer: 'midground',
        targetLocation: 'dining_room',
        inspectTitle: 'East Archway — Dining Room',
        inspectText: 'Double doors opening toward the formal Dining Room and terrace.',
        visualKind: 'arch_door'
      },
      {
        id: 'mh_talk_eleanor',
        label: 'Speak with Eleanor Blackwood',
        type: 'talk',
        x: 785,
        y: 410,
        width: 90,
        height: 240,
        depthLayer: 'midground',
        characterId: 'eleanor',
        inspectTitle: 'Eleanor Blackwood',
        inspectText: 'Edward’s wife stands rigid near the balustrade, clutching a silk shawl.'
      }
    ]
  },

  upstairs_corridor: {
    id: 'upstairs_corridor',
    name: 'Upstairs Corridor',
    subtitle: 'Upper Gallery — Outside the Locked Study',
    ambientDesc:
      'Floorboards groan along the dark burgundy runner. Rain rattles the narrow gallery window while ancestral portraits stare down toward Edward’s heavy oak study door.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'corridor',
    palette: {
      skyTop: '#0b121c',
      skyBottom: '#192434',
      farWall: '#1b1412',
      midWall: '#2b181b',
      floor: '#140f0c',
      trim: '#4a3121',
      lampGlow: '#c78c3e',
      accent: '#4d191e'
    },
    audio: {
      baseDroneHz: 62,
      rainIntensity: 0.65,
      thunderChance: 0.4,
      tickingClock: false,
      fireplace: false,
      creaks: true,
      drip: false
    },
    exits: [
      { locationId: 'main_hall', label: 'Main Hall (Stairs)', direction: 'down' },
      { locationId: 'study', label: "Edward's Study", direction: 'door' },
      { locationId: 'guest_bedroom', label: 'Guest Bedroom', direction: 'right' }
    ],
    hotspots: [
      {
        id: 'uc_stairs_down',
        label: 'Descend to Main Hall',
        type: 'move',
        x: 135,
        y: 390,
        width: 135,
        height: 250,
        depthLayer: 'midground',
        targetLocation: 'main_hall',
        inspectTitle: 'Grand Staircase Descent',
        inspectText: 'Return downstairs to the Main Hall.',
        visualKind: 'staircase'
      },
      {
        id: 'uc_ancestral_portrait',
        label: 'Blackwood Portrait',
        type: 'examine',
        x: 420,
        y: 255,
        width: 130,
        height: 175,
        depthLayer: 'midground',
        inspectTitle: 'Portrait of Lord Henry Blackwood',
        inspectText:
          'Dark oil paint, cracked with age. Beneath the frame, faint dusty boot scuffs smudge the wainscot—someone lingered quietly in this alcove before midnight.',
        visualKind: 'painting'
      },
      {
        id: 'uc_eleanor_handkerchief',
        label: 'Dropped Silk Handkerchief',
        type: 'collect',
        x: 615,
        y: 575,
        width: 85,
        height: 60,
        depthLayer: 'foreground',
        collectClueId: 'eleanor_handkerchief',
        inspectTitle: 'Monogrammed Silk Handkerchief',
        inspectText:
          'Half-tucked beneath the baseboard trim sits an ivory silk handkerchief stitched with "E.B." and scented with French jasmine.',
        alreadyDoneText: 'You already bagged Eleanor’s monogrammed handkerchief from the baseboard.',
        visualKind: 'floor_item'
      },
      {
        id: 'uc_study_door',
        label: "Edward's Study Door",
        type: 'use',
        x: 840,
        y: 370,
        width: 145,
        height: 270,
        depthLayer: 'midground',
        targetLocation: 'study',
        puzzleId: 'force_study_door',
        inspectTitle: "Edward's Locked Study Door",
        inspectText:
          'Heavy oak bolted tight. No key sits in the keyhole—and no sound answers from within.',
        visualKind: 'locked_study_door'
      },
      {
        id: 'uc_wall_sconce',
        label: 'Flickering Wall Sconce',
        type: 'examine',
        x: 1090,
        y: 270,
        width: 75,
        height: 120,
        depthLayer: 'midground',
        inspectTitle: 'Brass Wall Sconce',
        inspectText:
          'One bulb dims whenever lightning surges over the moor. Directly opposite sits the Guest Bedroom occupied by Dr. Samuel Reed.',
        visualKind: 'sconce'
      },
      {
        id: 'uc_guest_door',
        label: 'Enter Guest Bedroom',
        type: 'move',
        x: 1370,
        y: 375,
        width: 130,
        height: 265,
        depthLayer: 'midground',
        targetLocation: 'guest_bedroom',
        inspectTitle: 'Guest Bedroom Door',
        inspectText: 'The spare guest suite assigned to Dr. Samuel Reed for the weekend.',
        visualKind: 'paneled_door'
      },
      {
        id: 'uc_talk_thomas',
        label: 'Speak with Thomas Blackwood',
        type: 'talk',
        x: 720,
        y: 410,
        width: 90,
        height: 240,
        depthLayer: 'midground',
        characterId: 'thomas',
        inspectTitle: 'Thomas Blackwood',
        inspectText: 'Edward’s younger brother hovers anxiously outside the locked study door.'
      }
    ]
  },

  study: {
    id: 'study',
    name: "Edward's Study",
    subtitle: 'Crime Scene — Locked Interior, 11:32 PM',
    ambientDesc:
      'Rain drums furiously on the tall bay window. A green banker’s lamp casts harsh shadows over Edward Blackwood’s slumped silhouette, spilled brandy, and shattered glass.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'study',
    palette: {
      skyTop: '#081018',
      skyBottom: '#162332',
      farWall: '#191410',
      midWall: '#241a13',
      floor: '#120c09',
      trim: '#3f2c1c',
      lampGlow: '#b89443',
      accent: '#59161b'
    },
    audio: {
      baseDroneHz: 48,
      rainIntensity: 0.85,
      thunderChance: 0.45,
      tickingClock: false,
      fireplace: true,
      creaks: true,
      drip: false
    },
    exits: [
      { locationId: 'upstairs_corridor', label: 'Upstairs Corridor', direction: 'left' },
      { locationId: 'basement', label: 'Hidden Stair to Basement', direction: 'down' }
    ],
    hotspots: [
      {
        id: 'st_exit_corridor',
        label: 'Exit to Upstairs Corridor',
        type: 'move',
        x: 110,
        y: 385,
        width: 115,
        height: 260,
        depthLayer: 'midground',
        targetLocation: 'upstairs_corridor',
        inspectTitle: 'Study Doorway',
        inspectText: 'The splintered oak doorway back out to the Upstairs Corridor.',
        visualKind: 'paneled_door'
      },
      {
        id: 'st_bay_window',
        label: 'Rain-Lashed Bay Window',
        type: 'examine',
        x: 345,
        y: 295,
        width: 170,
        height: 245,
        depthLayer: 'midground',
        inspectTitle: 'Mullioned Bay Window',
        inspectText:
          'Latched securely from inside with rusted brass catches untouched by dust. Looking straight down through the streaming glass, you spot the Dining Room stone terrace directly below.',
        visualKind: 'window'
      },
      {
        id: 'st_edward_body',
        label: 'Examine Edward Blackwood',
        type: 'examine',
        x: 690,
        y: 445,
        width: 160,
        height: 150,
        depthLayer: 'midground',
        inspectTitle: 'Body of Edward Blackwood',
        inspectText:
          'Edward lies slumped forward across the blotter. A single brutal blow fractured his left temple—yet there are no defensive bruises on his knuckles or forearms. He was drugged or incapacitated before the strike.',
        visualKind: 'victim_desk'
      },
      {
        id: 'st_pocket_watch',
        label: 'Shattered Pocket Watch',
        type: 'collect',
        x: 615,
        y: 560,
        width: 80,
        height: 60,
        depthLayer: 'foreground',
        collectClueId: 'broken_pocket_watch',
        inspectTitle: 'Gold Pocket Watch on Rug',
        inspectText:
          'Pinned beneath Edward’s right sleeve as he fell. The crystal shattered, halting the delicate hands at precisely 11:32 PM.',
        alreadyDoneText: 'You already documented and bagged the pocket watch stopped at 11:32 PM.',
        visualKind: 'floor_item'
      },
      {
        id: 'st_brandy_glass',
        label: 'Half-Empty Brandy Snifter',
        type: 'collect',
        x: 785,
        y: 410,
        width: 75,
        height: 75,
        depthLayer: 'midground',
        collectClueId: 'laced_brandy_glass',
        inspectTitle: 'Edward’s Desk Snifter',
        inspectText:
          'Warm amber brandy pools around white undissolved crystals at the base of the glass. A faint, sweet-bitter medicinal scent lingers.',
        alreadyDoneText: 'The sedative-laced glass is secured in your evidence kit.',
        visualKind: 'desk_item'
      },
      {
        id: 'st_desk_calendar',
        label: 'Desk Blotter & Note',
        type: 'examine',
        x: 715,
        y: 390,
        width: 95,
        height: 60,
        depthLayer: 'midground',
        inspectTitle: 'Edward’s Desk Blotter',
        inspectText:
          'Scrawled across today’s blotter in trembling ink: "14 / 09 / 92 — Miller Autopsy. Tell Hayes the whole truth tonight before midnight." Three numbers underlined twice: 14 - 09 - 92.',
        visualKind: 'desk_item'
      },
      {
        id: 'st_paperweight',
        label: 'Brass Lion Paperweight',
        type: 'collect',
        x: 965,
        y: 505,
        width: 85,
        height: 85,
        depthLayer: 'midground',
        collectClueId: 'brass_paperweight',
        inspectTitle: 'Tarnished Paperweight by Hearth',
        inspectText:
          'Tucked inside the brass fender beside the fireplace. Someone wiped it hastily with cloth, leaving dark dried blood and grey wool fibers along the lion’s pedestal.',
        alreadyDoneText: 'The brass paperweight—the murder weapon—is in your inventory.',
        visualKind: 'hearth_item'
      },
      {
        id: 'st_wall_safe',
        label: 'Portrait & Wall Safe',
        type: 'use',
        x: 1170,
        y: 315,
        width: 140,
        height: 170,
        depthLayer: 'midground',
        puzzleId: 'study_safe',
        inspectTitle: 'Concealed Brass Dial Safe',
        inspectText:
          'Swinging aside the oil landscape reveals a steel Chubb dial safe requiring a three-number combination.',
        alreadyDoneText:
          'The safe stands empty now; you have already claimed the 1992 Toxicology Dossier and Revised Will.',
        visualKind: 'wall_safe'
      },
      {
        id: 'st_bookcase_passage',
        label: 'East Bookcase Secret Door',
        type: 'move',
        x: 1410,
        y: 375,
        width: 135,
        height: 270,
        depthLayer: 'midground',
        targetLocation: 'basement',
        requiredFlag: 'secret_passage_found',
        inspectTitle: 'Concealed Spiral Staircase',
        inspectText:
          'The eastern mahogany bookcase pivots outward onto a narrow spiral stone stair descending straight into the Basement!',
        visualKind: 'bookcase'
      },
      {
        id: 'st_bookcase_locked',
        label: 'East Mahogany Bookcase',
        type: 'examine',
        x: 1410,
        y: 375,
        width: 135,
        height: 270,
        depthLayer: 'midground',
        hiddenIfFlag: 'secret_passage_found',
        inspectTitle: 'Heavy Mahogany Bookcase',
        inspectText:
          'Packed tight with legal volumes. Wait—thin black coal soot lines the floorboards along its left plinth, and a faint draft breathes behind the timber...',
        visualKind: 'bookcase'
      }
    ]
  },

  library: {
    id: 'library',
    name: 'Library',
    subtitle: 'West Wing — Family Archive & Map Room',
    ambientDesc:
      'Towering walnut shelves smell of damp leather and old ink. A green-shaded reading lamp pools yellow light over maps, medical texts, and a quiet corner armchair.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'library',
    palette: {
      skyTop: '#0b141e',
      skyBottom: '#1a2a38',
      farWall: '#171c19',
      midWall: '#202b25',
      floor: '#121310',
      trim: '#463421',
      lampGlow: '#c79b42',
      accent: '#2a4136'
    },
    audio: {
      baseDroneHz: 52,
      rainIntensity: 0.45,
      thunderChance: 0.2,
      tickingClock: true,
      fireplace: false,
      creaks: true,
      drip: false
    },
    exits: [
      { locationId: 'main_hall', label: 'Main Hall', direction: 'right' },
      { locationId: 'billiard_room', label: 'Billiard Room', direction: 'door' }
    ],
    hotspots: [
      {
        id: 'lib_exit_main',
        label: 'Return to Main Hall',
        type: 'move',
        x: 1435,
        y: 385,
        width: 120,
        height: 255,
        depthLayer: 'midground',
        targetLocation: 'main_hall',
        inspectTitle: 'East Doors — Main Hall',
        inspectText: 'Step back out into the Main Hall.',
        visualKind: 'arch_door'
      },
      {
        id: 'lib_exit_billiard',
        label: 'Connecting Door to Billiard Room',
        type: 'move',
        x: 160,
        y: 390,
        width: 105,
        height: 245,
        depthLayer: 'midground',
        targetLocation: 'billiard_room',
        inspectTitle: 'Side Passage — Billiard Room',
        inspectText: 'A narrow walnut door linking the Library to the Billiard Room.',
        visualKind: 'paneled_door'
      },
      {
        id: 'lib_map_cabinet',
        label: 'Architect Map Cabinet',
        type: 'collect',
        x: 430,
        y: 440,
        width: 145,
        height: 170,
        depthLayer: 'midground',
        collectClueId: 'servant_passage_blueprint',
        inspectTitle: '1920 Manor Architectural Drawer',
        inspectText:
          'Half-pulled from a wide oak flat-file drawer lies a brittle blue-line architectural sheet of Blackwood Manor, marked in red ink with a concealed service stair between the Basement and Study.',
        alreadyDoneText: 'You already took the 1920 Manor Blueprint from the map drawer.',
        visualKind: 'map_chest'
      },
      {
        id: 'lib_medical_shelf',
        label: 'Toxicology & Medical Shelf',
        type: 'examine',
        x: 720,
        y: 345,
        width: 155,
        height: 225,
        depthLayer: 'midground',
        inspectTitle: 'Medical & Toxicology Volumes',
        inspectText:
          'A leather volume on "Clinical Sedatives & Chloral Hydrate" sits pulled forward an inch from the row. A slip bookmark rests on the page detailing rapid incapacitation in alcohol.',
        visualKind: 'bookshelf'
      },
      {
        id: 'lib_sketchbook',
        label: "Clara's Sketchbook",
        type: 'collect',
        x: 990,
        y: 485,
        width: 90,
        height: 75,
        depthLayer: 'midground',
        collectClueId: 'clara_sketchbook',
        inspectTitle: 'Charcoal Sketchbook on Reading Cushion',
        inspectText:
          'Tucked behind the window-seat cushion lies a spiral sketchbook. Its last page—dated tonight, 11:36 PM—shows wire-rimmed spectacles over a scullery sink.',
        alreadyDoneText: 'Clara’s charcoal sketchbook is safely inside your case file.',
        visualKind: 'desk_item'
      },
      {
        id: 'lib_talk_clara',
        label: 'Speak with Clara Blackwood',
        type: 'talk',
        x: 1170,
        y: 415,
        width: 90,
        height: 235,
        depthLayer: 'midground',
        characterId: 'clara',
        inspectTitle: 'Clara Blackwood',
        inspectText: 'Edward’s daughter sits in the shadowed alcove, staring calmly at the rain.'
      }
    ]
  },

  dining_room: {
    id: 'dining_room',
    name: 'Dining Room',
    subtitle: 'East Wing — Formal Table & Terrace Doors',
    ambientDesc:
      'Half-burned tapers flicker above untouched dessert plates. Rain sweeps against French terrace doors on the far wall while damp footprints glisten near the threshold.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'dining_room',
    palette: {
      skyTop: '#0b1420',
      skyBottom: '#1a2838',
      farWall: '#221315',
      midWall: '#36191e',
      floor: '#150e0b',
      trim: '#4a3021',
      lampGlow: '#cf9645',
      accent: '#632026'
    },
    audio: {
      baseDroneHz: 58,
      rainIntensity: 0.78,
      thunderChance: 0.35,
      tickingClock: false,
      fireplace: false,
      creaks: true,
      drip: false
    },
    exits: [
      { locationId: 'main_hall', label: 'Main Hall', direction: 'left' },
      { locationId: 'kitchen', label: 'Kitchen', direction: 'door' }
    ],
    hotspots: [
      {
        id: 'dr_exit_main',
        label: 'Return to Main Hall',
        type: 'move',
        x: 115,
        y: 385,
        width: 115,
        height: 255,
        depthLayer: 'midground',
        targetLocation: 'main_hall',
        inspectTitle: 'West Archway — Main Hall',
        inspectText: 'Return to the Main Hall foyer.',
        visualKind: 'arch_door'
      },
      {
        id: 'dr_briefcase_ledger',
        label: "Victor's Leather Briefcase",
        type: 'collect',
        x: 425,
        y: 470,
        width: 115,
        height: 110,
        depthLayer: 'midground',
        collectClueId: 'falsified_ledger',
        inspectTitle: 'Unlatched Sideboard Briefcase',
        inspectText:
          'Inside Victor Hale’s monogrammed briefcase rests a Blackwood Industries shipping ledger riddled with red-ink audit flags—£120,000 vanished into shell accounts.',
        alreadyDoneText: 'You already confiscated the doctored shipping ledger.',
        visualKind: 'briefcase'
      },
      {
        id: 'dr_dining_table',
        label: 'Formal Mahogany Table',
        type: 'examine',
        x: 760,
        y: 465,
        width: 260,
        height: 120,
        depthLayer: 'midground',
        inspectTitle: 'Dinner Table Settings',
        inspectText:
          'Six places set, only five chairs pushed back—Edward skipped dinner entirely to wait alone in his study. Three decanters sit untouched.',
        visualKind: 'dining_table'
      },
      {
        id: 'dr_terrace_cigarette',
        label: 'Terrace Doors & Cigarette Butt',
        type: 'collect',
        x: 1150,
        y: 365,
        width: 145,
        height: 265,
        depthLayer: 'midground',
        collectClueId: 'turkish_cigarette',
        inspectTitle: 'French Terrace Doors',
        inspectText:
          'Opening the latch reveals stone eaves directly beneath Edward’s Study bay window. Wedged in the wet door track lies a half-smoked gold-tipped Turkish cigarette—dry at the filter, ash swept inward by the 11:30 squall.',
        alreadyDoneText: 'From the stone eaves outside, you can look straight up to the Study bay window.',
        visualKind: 'terrace_doors'
      },
      {
        id: 'dr_door_kitchen',
        label: 'Enter Kitchen',
        type: 'move',
        x: 1455,
        y: 390,
        width: 105,
        height: 245,
        depthLayer: 'midground',
        targetLocation: 'kitchen',
        inspectTitle: 'Service Door — Kitchen',
        inspectText: 'Swinging butler’s door into the Kitchen.',
        visualKind: 'baize_door'
      },
      {
        id: 'dr_talk_victor',
        label: 'Speak with Victor Hale',
        type: 'talk',
        x: 1015,
        y: 410,
        width: 90,
        height: 240,
        depthLayer: 'midground',
        characterId: 'victor',
        inspectTitle: 'Victor Hale',
        inspectText: 'Edward’s business associate shakes rainwater from his trenchcoat cuffs.'
      }
    ]
  },

  billiard_room: {
    id: 'billiard_room',
    name: 'Billiard Room',
    subtitle: 'South Parlor — Smoke & Scorched Paper',
    ambientDesc:
      'A low brass hood illuminates faded green baize. Ash cools in the stone grate while cues lean undisturbed along the burgundy wainscot.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'billiard_room',
    palette: {
      skyTop: '#0b141c',
      skyBottom: '#16212c',
      farWall: '#1b1d18',
      midWall: '#253328',
      floor: '#14110d',
      trim: '#4a3120',
      lampGlow: '#cca049',
      accent: '#244732'
    },
    audio: {
      baseDroneHz: 54,
      rainIntensity: 0.4,
      thunderChance: 0.18,
      tickingClock: true,
      fireplace: true,
      creaks: false,
      drip: false
    },
    exits: [
      { locationId: 'main_hall', label: 'Main Hall', direction: 'left' },
      { locationId: 'library', label: 'Library', direction: 'door' }
    ],
    hotspots: [
      {
        id: 'br_exit_main',
        label: 'Return to Main Hall',
        type: 'move',
        x: 120,
        y: 390,
        width: 110,
        height: 250,
        depthLayer: 'midground',
        targetLocation: 'main_hall',
        inspectTitle: 'Main Hall Door',
        inspectText: 'Step back into the Main Hall.',
        visualKind: 'paneled_door'
      },
      {
        id: 'br_billiard_table',
        label: 'Green Felt Billiard Table',
        type: 'examine',
        x: 680,
        y: 465,
        width: 310,
        height: 135,
        depthLayer: 'midground',
        inspectTitle: 'Snooker & Billiard Table',
        inspectText:
          'All fifteen balls sit racked neatly inside the triangle, untouched by chalk dust—and the cue rests hang dry. Thomas wasn’t playing solo billiards as he claimed.',
        visualKind: 'billiard_table'
      },
      {
        id: 'br_fireplace_note',
        label: 'Smoldering Hearth Grate',
        type: 'collect',
        x: 1090,
        y: 430,
        width: 150,
        height: 185,
        depthLayer: 'midground',
        collectClueId: 'torn_threatening_note',
        inspectTitle: 'Billiard Room Fireplace',
        inspectText:
          'Half-curled atop grey ash lies a scorched stationery scrap in Edward’s hand: "Forty thousand pounds in Soho gaming houses is your ruin, Thomas..."',
        alreadyDoneText: 'Only cold ash and cinders remain in the grate.',
        visualKind: 'fireplace'
      },
      {
        id: 'br_exit_library',
        label: 'Enter Library',
        type: 'move',
        x: 1445,
        y: 390,
        width: 110,
        height: 245,
        depthLayer: 'midground',
        targetLocation: 'library',
        inspectTitle: 'Side Door — Library',
        inspectText: 'Connects directly into the Manor Library.',
        visualKind: 'paneled_door'
      }
    ]
  },

  kitchen: {
    id: 'kitchen',
    name: 'Kitchen & Scullery',
    subtitle: 'Service Wing — Cast-Iron Range & Cellar Stairs',
    ambientDesc:
      'Copper saucepans gleam dimly above an iron range. Beside the porcelain scullery sink, a damp towel hangs crookedly near the heavy bolted door to the Basement.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'kitchen',
    palette: {
      skyTop: '#0d151d',
      skyBottom: '#1a252c',
      farWall: '#1b1d1b',
      midWall: '#292c27',
      floor: '#171715',
      trim: '#3f352a',
      lampGlow: '#c99b4c',
      accent: '#344038'
    },
    audio: {
      baseDroneHz: 60,
      rainIntensity: 0.35,
      thunderChance: 0.15,
      tickingClock: false,
      fireplace: true,
      creaks: false,
      drip: true
    },
    exits: [
      { locationId: 'main_hall', label: 'Main Hall', direction: 'left' },
      { locationId: 'dining_room', label: 'Dining Room', direction: 'door' },
      { locationId: 'basement', label: 'Basement Cellar', direction: 'down' }
    ],
    hotspots: [
      {
        id: 'kt_exit_main',
        label: 'Return to Main Hall',
        type: 'move',
        x: 115,
        y: 390,
        width: 105,
        height: 245,
        depthLayer: 'midground',
        targetLocation: 'main_hall',
        inspectTitle: 'Green Baize Door — Main Hall',
        inspectText: 'Return to the Main Hall.',
        visualKind: 'baize_door'
      },
      {
        id: 'kt_exit_dining',
        label: 'Enter Dining Room',
        type: 'move',
        x: 310,
        y: 390,
        width: 100,
        height: 240,
        depthLayer: 'midground',
        targetLocation: 'dining_room',
        inspectTitle: 'Butler’s Door — Dining Room',
        inspectText: 'Leads straight into the Dining Room.',
        visualKind: 'baize_door'
      },
      {
        id: 'kt_range_stove',
        label: 'Cast-Iron Range & Kettle',
        type: 'examine',
        x: 560,
        y: 425,
        width: 195,
        height: 190,
        depthLayer: 'midground',
        inspectTitle: 'Victorian Range Stove',
        inspectText:
          'A copper kettle sits lukewarm on the back hob. Wait—the kettle hasn’t boiled in well over an hour, despite Dr. Reed claiming he brewed fresh chamomile tea around 11:15 PM.',
        visualKind: 'stove'
      },
      {
        id: 'kt_washbasin_towel',
        label: 'Scullery Sink & Stained Towel',
        type: 'collect',
        x: 920,
        y: 445,
        width: 135,
        height: 155,
        depthLayer: 'midground',
        collectClueId: 'damp_washcloth',
        inspectTitle: 'Porcelain Scullery Basin',
        inspectText:
          'Grey-black soot smears the inside of the porcelain bowl. Hanging on the hook beside it, a linen towel is still damp with pungent carbolic surgical soap and coal grime.',
        alreadyDoneText: 'Only dark soot flecks remain around the scullery drain.',
        visualKind: 'sink'
      },
      {
        id: 'kt_cellar_door',
        label: 'Descend to Basement',
        type: 'move',
        x: 1390,
        y: 385,
        width: 130,
        height: 260,
        depthLayer: 'midground',
        targetLocation: 'basement',
        inspectTitle: 'Oak Cellar Door',
        inspectText:
          'Oddly, the heavy sliding bolt on the cellar door has been slid open—though Margaret swears nobody goes down after dusk.',
        visualKind: 'cellar_door'
      },
      {
        id: 'kt_talk_margaret',
        label: 'Speak with Margaret Wells',
        type: 'talk',
        x: 1140,
        y: 410,
        width: 90,
        height: 240,
        depthLayer: 'midground',
        characterId: 'margaret',
        inspectTitle: 'Margaret Wells',
        inspectText: 'The veteran housekeeper wipes silver spoons with tense precision.'
      }
    ]
  },

  guest_bedroom: {
    id: 'guest_bedroom',
    name: 'Guest Bedroom',
    subtitle: "Dr. Samuel Reed's Quarters — East Upper Wing",
    ambientDesc:
      'A neat four-poster bed stands untouched beneath olive wool blankets. On a brass bench rests Dr. Reed’s Gladstone medical bag beside a damp raincoat on the peg.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'guest_room',
    palette: {
      skyTop: '#0a121c',
      skyBottom: '#182534',
      farWall: '#1b1815',
      midWall: '#29221d',
      floor: '#15110d',
      trim: '#4a3524',
      lampGlow: '#c99446',
      accent: '#2c3d37'
    },
    audio: {
      baseDroneHz: 56,
      rainIntensity: 0.62,
      thunderChance: 0.25,
      tickingClock: true,
      fireplace: false,
      creaks: true,
      drip: false
    },
    exits: [{ locationId: 'upstairs_corridor', label: 'Upstairs Corridor', direction: 'left' }],
    hotspots: [
      {
        id: 'gb_exit_corridor',
        label: 'Exit to Upstairs Corridor',
        type: 'move',
        x: 115,
        y: 385,
        width: 115,
        height: 255,
        depthLayer: 'midground',
        targetLocation: 'upstairs_corridor',
        inspectTitle: 'Corridor Door',
        inspectText: 'Return to the Upstairs Corridor.',
        visualKind: 'paneled_door'
      },
      {
        id: 'gb_damp_coat_boots',
        label: 'Coat Hook & Oxford Boots',
        type: 'examine',
        x: 345,
        y: 410,
        width: 120,
        height: 210,
        depthLayer: 'midground',
        inspectTitle: "Dr. Reed's Raincoat & Oxfords",
        inspectText:
          'Wait—the cuffs of Reed’s spare trousers are damp, and fine black coal grit clings to the welts of his polished size-10 leather oxfords. Why would a physician have coal soot on his shoes?',
        visualKind: 'coat_rack'
      },
      {
        id: 'gb_bed_quilt',
        label: 'Untouched Four-Poster Bed',
        type: 'examine',
        x: 685,
        y: 420,
        width: 245,
        height: 175,
        depthLayer: 'midground',
        inspectTitle: 'Four-Poster Bed',
        inspectText:
          'A single neat indentation sits atop the quilt, staged hastily—yet the sheets beneath remain hospital-corner crisp and cold.',
        visualKind: 'bed'
      },
      {
        id: 'gb_nightstand_clock',
        label: 'Nightstand: Cold Tea & Alarm Clock',
        type: 'collect',
        x: 965,
        y: 465,
        width: 115,
        height: 135,
        depthLayer: 'midground',
        collectClueId: 'guest_room_teacup',
        inspectTitle: 'Cold Chamomile & Travel Clock',
        inspectText:
          'The porcelain teacup is stone-cold, rings of dried tannin proof it sat untouched for over an hour. Opening the clock’s rear battery hatch also reveals a tiny nickel apothecary key!',
        alreadyDoneText: 'The stone-cold teacup sits empty beside the open travel clock.',
        visualKind: 'nightstand'
      },
      {
        id: 'gb_apothecary_key',
        label: 'Tiny Key in Clock Hatch',
        type: 'collect',
        x: 1035,
        y: 430,
        width: 75,
        height: 75,
        depthLayer: 'foreground',
        collectClueId: 'apothecary_key',
        inspectTitle: 'Miniature Apothecary Key',
        inspectText:
          'Concealed inside the battery compartment of Dr. Reed’s travel clock sits a miniature nickel key—made for a Gladstone medical bag clasp.',
        alreadyDoneText: 'You already retrieved the miniature apothecary key.',
        visualKind: 'desk_item'
      },
      {
        id: 'gb_medical_bag',
        label: "Dr. Reed's Locked Medical Bag",
        type: 'use',
        x: 1190,
        y: 495,
        width: 120,
        height: 115,
        depthLayer: 'midground',
        puzzleId: 'medical_bag',
        inspectTitle: 'Leather Gladstone Medical Bag',
        inspectText:
          'A heavy oxblood leather doctor’s bag secured with a small recessed brass lock.',
        alreadyDoneText:
          'The medical bag stands unlatched; you have already secured the Chloral Hydrate bottle inside.',
        visualKind: 'medical_bag'
      },
      {
        id: 'gb_talk_reed',
        label: 'Speak with Dr. Samuel Reed',
        type: 'talk',
        x: 1385,
        y: 410,
        width: 90,
        height: 240,
        depthLayer: 'midground',
        characterId: 'reed',
        inspectTitle: 'Dr. Samuel Reed',
        inspectText: 'The physician adjusts his wire-rimmed spectacles with cool composure.'
      }
    ]
  },

  basement: {
    id: 'basement',
    name: 'Basement Cellar',
    subtitle: 'Sub-Level — Coal Furnace & Wine Vault',
    ambientDesc:
      'Water drips steadily across damp flagstones. Beyond rusted wine racks and a cold cast-iron coal furnace, a draft whispers from behind the far masonry.',
    worldWidth: 1600,
    worldHeight: 720,
    assetFolder: 'basement',
    palette: {
      skyTop: '#06090e',
      skyBottom: '#0e141c',
      farWall: '#121417',
      midWall: '#1b1e22',
      floor: '#0d0f12',
      trim: '#302b25',
      lampGlow: '#b5843a',
      accent: '#283642'
    },
    audio: {
      baseDroneHz: 44,
      rainIntensity: 0.12,
      thunderChance: 0.1,
      tickingClock: false,
      fireplace: false,
      creaks: true,
      drip: true
    },
    exits: [
      { locationId: 'kitchen', label: 'Kitchen Stairs', direction: 'up' },
      { locationId: 'study', label: "Hidden Stair to Edward's Study", direction: 'up' }
    ],
    hotspots: [
      {
        id: 'bs_exit_kitchen',
        label: 'Climb to Kitchen',
        type: 'move',
        x: 135,
        y: 380,
        width: 130,
        height: 260,
        depthLayer: 'midground',
        targetLocation: 'kitchen',
        inspectTitle: 'Cellar Steps — Kitchen',
        inspectText: 'Wooden steps climbing back into the Kitchen.',
        visualKind: 'staircase'
      },
      {
        id: 'bs_coal_furnace',
        label: 'Cast-Iron Coal Furnace',
        type: 'collect',
        x: 520,
        y: 415,
        width: 195,
        height: 215,
        depthLayer: 'midground',
        collectClueId: 'missing_study_key',
        inspectTitle: 'Manor Coal Furnace & Ash Grate',
        inspectText:
          'Raking through the cold black clinkers inside the ash pan uncovers a glint of brass—the missing mortise key to Edward’s locked study, dropped in haste!',
        alreadyDoneText: 'The ash grate lies empty save for cold grey cinders.',
        visualKind: 'furnace'
      },
      {
        id: 'bs_wine_rack_lever',
        label: 'Dusty Wine Rack & Iron Lever',
        type: 'use',
        x: 960,
        y: 390,
        width: 175,
        height: 245,
        depthLayer: 'midground',
        puzzleId: 'wine_lever',
        inspectTitle: '1920 Wine Rack Mechanism',
        inspectText:
          'Behind an empty burgundy bin, a forged iron wall sconce hangs loose—connected to a counterweighted pivot in the masonry.',
        alreadyDoneText: 'The wine rack stands swung inward, revealing the concealed spiral staircase.',
        visualKind: 'wine_rack'
      },
      {
        id: 'bs_boot_prints',
        label: 'Coal-Dusted Boot Prints',
        type: 'collect',
        x: 1225,
        y: 560,
        width: 130,
        height: 75,
        depthLayer: 'foreground',
        requiredFlag: 'secret_passage_found',
        collectClueId: 'coal_dust_footprints',
        inspectTitle: 'Size 10 Dress-Boot Impressions',
        inspectText:
          'Fresh damp coal-dust footprints ascend the hidden spiral stone steps—narrow size-10 gentleman’s leather oxfords, far lighter than a laborer’s boots.',
        alreadyDoneText: 'You already sketched and measured the size-10 coal footprints.',
        visualKind: 'floor_item'
      },
      {
        id: 'bs_secret_stair_up',
        label: "Ascend Hidden Stair to Study",
        type: 'move',
        x: 1385,
        y: 365,
        width: 145,
        height: 270,
        depthLayer: 'midground',
        requiredFlag: 'secret_passage_found',
        targetLocation: 'study',
        inspectTitle: 'Concealed 1920 Spiral Staircase',
        inspectText:
          'Climb the narrow dusty masonry steps leading directly behind the eastern bookcase in Edward’s Study.',
        visualKind: 'secret_stair'
      }
    ]
  }
};

export const LOCATION_LIST: LocationDefinition[] = Object.values(LOCATIONS);
