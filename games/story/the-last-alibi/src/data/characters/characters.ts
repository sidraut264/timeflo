import { CharacterDefinition, CharacterId } from '../../types/game';

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  eleanor: {
    id: 'eleanor',
    name: 'Eleanor Blackwood',
    role: 'Mistress of Blackwood Manor (Wife)',
    age: 47,
    locationId: 'main_hall',
    spriteX: 785,
    spriteY: 420,
    spriteHeight: 350,
    portraitPath: 'assets/characters/portraits/eleanor.png',
    spritePath: 'assets/characters/sprites/eleanor.png',
    personality: 'Composed, aristocratic, brittle beneath her poise.',
    history:
      'Married Edward twenty-two years ago to rescue her family’s Norfolk estate. Their marriage hollowed into polite silence long ago.',
    claimedAlibi: 'Claims she retired to her upstairs bedchamber at 10:30 PM with a novel.',
    motiveSummary: 'Edward drafted a new will stripping her of the estate.',
    secretSummary:
      'She crept down the corridor at 11:40 PM to inspect the revised will—only to find the study already locked from within.',
    relationships:
      'Despises Thomas’s debts; polite yet distant with Clara; distrusts Victor Hale.',
    coatColor: '#561b22',
    accentColor: '#c9a66b',
    hairColor: '#2a2224',
    skinTone: '#d6bfa9',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Eleanor glances down at the item without blinking. "Does that explain who locked my husband in his study, Detective? Because I fail to see how."',
    presentReactions: {
      eleanor_handkerchief: {
        text: 'Her fingers tighten around the balustrade. "Very well. I did go to his study door—around twenty to twelve. I wanted to speak with him before morning, found it locked, and heard nothing inside. I left before Thomas came up."',
        setsFlag: 'confronted_eleanor',
        journalTitle: 'Eleanor Caught in a Lie',
        journalBody:
          'Confronted with her jasmine-scented handkerchief, Eleanor admitted standing outside the locked study around 11:40 PM—though the door was already bolted.'
      },
      revised_will_draft: {
        text: 'Her pale cheek twitches. "So you found the solicitor’s draft. Yes, Edward threatened to cut me out entirely—and yet that paper is unsigned, Detective. A dead man cannot sign a new will, nor can an unsigned one disinherit me. Still... I did not strike him."',
        setsFlag: 'confronted_eleanor',
        journalTitle: 'Eleanor & the Unsigned Will',
        journalBody:
          'Eleanor knew about Edward’s unsigned new will; she snuck to the study at 11:40 PM hoping to confront him or read it.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'calm',
        text: 'Detective Hayes. Edward said an old acquaintance from Scotland Yard was coming through the storm—though I hardly expected us to meet over his body.',
        choices: [
          {
            id: 'el_where',
            text: 'Where were you between eleven and midnight, Mrs. Blackwood?',
            nextNodeId: 'alibi',
            tone: 'neutral'
          },
          {
            id: 'el_invite',
            text: 'Why did Edward send for me tonight of all nights?',
            nextNodeId: 'invite',
            tone: 'press'
          },
          {
            id: 'el_handkerchief',
            text: '[Show Silk Handkerchief] If you never left your room, why was this outside the study?',
            nextNodeId: 'handkerchief_confront',
            requiredClueId: 'eleanor_handkerchief',
            tone: 'evidence'
          },
          {
            id: 'el_will',
            text: '[Show Revised Will] Were you trying to stop Edward from signing this?',
            nextNodeId: 'will_confront',
            requiredClueId: 'revised_will_draft',
            tone: 'evidence'
          },
          {
            id: 'el_leave',
            text: 'That will be all for now.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      alibi: {
        id: 'alibi',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'guarded',
        text: 'In the master suite at the end of the upper gallery, reading Trollope until Thomas began hammering on the study oak at quarter to twelve.',
        journalEntry: {
          id: 'j_eleanor_alibi',
          category: 'suspect',
          title: 'Eleanor’s Initial Alibi',
          body: 'Eleanor claims she remained in her bedroom from 10:30 PM until 11:47 PM.'
        },
        choices: [
          {
            id: 'el_alibi_hear',
            text: 'Did you hear footsteps in the corridor before 11:45?',
            nextNodeId: 'corridor_sound',
            tone: 'press'
          },
          {
            id: 'el_back',
            text: 'Let’s return to another matter.',
            nextNodeId: 'root'
          }
        ]
      },
      corridor_sound: {
        id: 'corridor_sound',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'nervous',
        text: 'Only the rain rattling the casements... and perhaps Dr. Reed’s door clicking shut around eleven. No—wait. I may have imagined that over the thunder.',
        choices: [
          {
            id: 'el_back2',
            text: 'I see. Let me ask something else.',
            nextNodeId: 'root'
          }
        ]
      },
      invite: {
        id: 'invite',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'cold',
        text: 'He told nobody. All week Edward stayed shut behind that oak door burning old bank folders and muttering about "1992". Whatever ghosts you two shared, Detective, you brought them with you.',
        choices: [
          {
            id: 'el_back3',
            text: 'Understood.',
            nextNodeId: 'root'
          }
        ]
      },
      handkerchief_confront: {
        id: 'handkerchief_confront',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'nervous',
        text: 'Lower your voice. Yes—I crept down the gallery around 11:40 PM. I needed to speak with Edward privately. The study door was already locked tight, no light under the sill. I dropped that in the dark and hurried back before anyone saw me.',
        setsFlag: 'confronted_eleanor',
        journalEntry: {
          id: 'j_eleanor_confess',
          category: 'conversation',
          title: 'Eleanor Outside the Study (11:40 PM)',
          body: 'Eleanor admits approaching the study at 11:40 PM—and swears the door was already locked and dark.'
        },
        choices: [
          {
            id: 'el_who_inside',
            text: 'If it was locked and dark at 11:40, Edward was already dead.',
            nextNodeId: 'already_dead',
            tone: 'press'
          },
          {
            id: 'el_back4',
            text: 'We’ll speak again shortly.',
            nextNodeId: 'root'
          }
        ]
      },
      already_dead: {
        id: 'already_dead',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'guarded',
        text: 'Then whoever murdered him was already gone—and they certainly didn’t walk past my door in the gallery.',
        choices: [{ id: 'el_back5', text: 'Remember that.', nextNodeId: 'root' }]
      },
      will_confront: {
        id: 'will_confront',
        speaker: 'Eleanor Blackwood',
        portraitMood: 'cold',
        text: 'Edward meant to leave everything to Clara and an impersonal trust. Cruel—yes. Worth hanging for? Hardly. Besides, if I’d wanted him dead, why would I leave the brass paperweight sitting by his hearth?',
        setsFlag: 'confronted_eleanor',
        choices: [{ id: 'el_back6', text: 'I’ll keep checking your story.', nextNodeId: 'root' }]
      }
    }
  },

  thomas: {
    id: 'thomas',
    name: 'Thomas Blackwood',
    role: 'Younger Brother',
    age: 41,
    locationId: 'upstairs_corridor',
    spriteX: 720,
    spriteY: 420,
    spriteHeight: 370,
    portraitPath: 'assets/characters/portraits/thomas.png',
    spritePath: 'assets/characters/sprites/thomas.png',
    personality: 'Impulsive, defensive, chronically in debt.',
    history:
      'Squandered his inheritance in London private gaming clubs. Relied on Edward’s quarterly allowance to stave off creditors.',
    claimedAlibi: 'Claims he played solo billiards downstairs from 10:45 until 11:45 PM.',
    motiveSummary: 'Edward threatened to cut off his allowance tonight over £40,000 in gambling IOUs.',
    secretSummary:
      'He never touched a billiard cue; he lingered in the shadows near the foyer trying to steal cash from Edward’s coat before coming upstairs at 11:47 PM.',
    relationships:
      'Bitterly resentful of Edward; avoids Clara; borrows money from Victor.',
    coatColor: '#3a2d21',
    accentColor: '#9c7840',
    hairColor: '#3b2b20',
    skinTone: '#cfa992',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Thomas rubs his temple hard. "Don’t wave things under my nose, Hayes—I’m half sick as it is."',
    presentReactions: {
      torn_threatening_note: {
        text: 'Thomas swallows hard. "Alright! We argued at ten-thirty. He swore he’d cut me off over those Soho markers. I threw the letter in the billiard grate and sulked in the dark—I never laid a finger on him!"',
        setsFlag: 'confronted_thomas',
        journalTitle: 'Thomas Admits the Billiard Room Lie',
        journalBody:
          'Confronted with the scorched threat, Thomas admitted he wasn’t playing billiards—he burned Edward’s ultimatum in the grate and stewed alone.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Thomas Blackwood',
        portraitMood: 'nervous',
        text: 'Thank God you’re up here, Hayes. Edward hasn’t answered a knock since eleven-fifteen, and the oak bolt is thrown tight.',
        choices: [
          {
            id: 'th_alibi',
            text: 'Where were you before coming up here at 11:47?',
            nextNodeId: 'alibi',
            tone: 'neutral'
          },
          {
            id: 'th_note',
            text: '[Show Charred Note] Nobody played billiards tonight—the balls were still racked. Explain this.',
            nextNodeId: 'note_confront',
            requiredClueId: 'torn_threatening_note',
            tone: 'evidence'
          },
          {
            id: 'th_reed',
            text: 'Did you see Dr. Reed or Eleanor in the upper hall?',
            nextNodeId: 'saw_hall',
            tone: 'press'
          },
          {
            id: 'th_leave',
            text: 'Stay near the stairs.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      alibi: {
        id: 'alibi',
        speaker: 'Thomas Blackwood',
        portraitMood: 'nervous',
        text: 'Down in the Billiard Room, knocking reds around by myself to clear my head. Nobody else came through.',
        journalEntry: {
          id: 'j_thomas_alibi',
          category: 'suspect',
          title: 'Thomas’s Claimed Alibi',
          body: 'Thomas claims he played solo billiards until 11:45 PM.'
        },
        choices: [{ id: 'th_back1', text: 'We’ll verify that.', nextNodeId: 'root' }]
      },
      note_confront: {
        id: 'note_confront',
        speaker: 'Thomas Blackwood',
        portraitMood: 'nervous',
        text: 'Damn it... fine! I didn’t touch a cue. Edward threatened to ruin me by morning. I burnt that note and drank two whiskeys in the dark, pacing near the hall coat-stand. When I finally walked up to beg him once more at 11:47, the door was bolted dead.',
        setsFlag: 'confronted_thomas',
        journalEntry: {
          id: 'j_thomas_confess',
          category: 'conversation',
          title: 'Thomas’s Argument & Alibi',
          body: 'Thomas burned Edward’s £40,000 debt ultimatum in the Billiard Room, but had no key and came upstairs at 11:47 PM.'
        },
        choices: [{ id: 'th_back2', text: 'Don’t leave the manor.', nextNodeId: 'root' }]
      },
      saw_hall: {
        id: 'saw_hall',
        speaker: 'Thomas Blackwood',
        portraitMood: 'guarded',
        text: 'When Margaret and I shouted outside the study, Dr. Reed didn’t open the Guest Bedroom door for a good thirty seconds—and when he finally stepped out, he was already fully dressed in waistcoat and tie, not nightclothes.',
        choices: [{ id: 'th_back3', text: 'Noted.', nextNodeId: 'root' }]
      }
    }
  },

  margaret: {
    id: 'margaret',
    name: 'Margaret Wells',
    role: 'Head Housekeeper (30 Years)',
    age: 64,
    locationId: 'kitchen',
    spriteX: 1140,
    spriteY: 420,
    spriteHeight: 340,
    portraitPath: 'assets/characters/portraits/margaret.png',
    spritePath: 'assets/characters/sprites/margaret.png',
    personality: 'Stoic, loyal to the manor walls, quietly perceptive.',
    history:
      'Has kept every key and floorboard of Blackwood Manor for thirty years, long before Eleanor married into the house.',
    claimedAlibi: 'Claims she stayed in the Kitchen polishing silver and banking the range.',
    motiveSummary: 'No personal malice toward Edward, though she protects family secrets fiercely.',
    secretSummary:
      'She knows about the 1920 spiral staircase linking the Basement wine vault to Edward’s Study—and saw a figure carrying a small lantern slip past the scullery near 11:35 PM.',
    relationships:
      'Protective of Clara; coldly formal toward Victor Hale and Dr. Reed.',
    coatColor: '#1d1f21',
    accentColor: '#9aa0a6',
    hairColor: '#6d7073',
    skinTone: '#d0b9a7',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Margaret adjusts her collar brooch. "I have seen thirty winters in this house, Detective, and I’ll not guess lightly."',
    presentReactions: {
      servant_passage_blueprint: {
        text: 'Margaret’s gaze drops to the red ink line on the 1920 drawing. "So you found the old coal-maid stair. Only four people alive knew that lever behind the wine bin still turns: Edward, myself... and Dr. Reed, after he asked about the manor’s damp foundations last autumn."',
        setsFlag: 'confronted_margaret',
        journalTitle: 'Margaret Confirms Reed Knew the Secret Stair',
        journalBody:
          'Margaret revealed that Dr. Samuel Reed specifically inquired about the old 1920 foundation passage months ago.'
      },
      damp_washcloth: {
        text: 'She sniffs the linen once and frowns deeply. "That isn’t my kitchen soap, Detective. That’s carbolic medical wash—the sort Dr. Reed keeps in his leather bag. And that black smudge is cellar coal dust."',
        setsFlag: 'confronted_margaret',
        journalTitle: 'Carbolic Soap Identified',
        journalBody:
          'Margaret identified the scent on the soot-stained scullery towel as Dr. Reed’s carbolic medical wash.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Margaret Wells',
        portraitMood: 'calm',
        text: 'Thirty years I’ve kept this house, Detective Hayes. Tonight the wind rattled every latch—yet nobody can lock a study door from the inside and vanish into mortar.',
        choices: [
          {
            id: 'mg_alibi',
            text: 'Did anyone pass through the Kitchen or scullery after eleven?',
            nextNodeId: 'scullery',
            tone: 'neutral'
          },
          {
            id: 'mg_blueprint',
            text: '[Show 1920 Blueprint] Does this secret stair behind the wine rack still open?',
            nextNodeId: 'blueprint_talk',
            requiredClueId: 'servant_passage_blueprint',
            tone: 'evidence'
          },
          {
            id: 'mg_towel',
            text: '[Show Stained Towel] Whose soap is on this towel by your sink?',
            nextNodeId: 'towel_talk',
            requiredClueId: 'damp_washcloth',
            tone: 'evidence'
          },
          {
            id: 'mg_edward_drink',
            text: 'Who brought Edward his evening brandy tonight?',
            nextNodeId: 'brandy_service',
            tone: 'press'
          },
          {
            id: 'mg_leave',
            text: 'Thank you, Mrs. Wells.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      scullery: {
        id: 'scullery',
        speaker: 'Margaret Wells',
        portraitMood: 'guarded',
        text: 'I stepped into the pantry for five minutes around half past eleven. When I came back out, the cellar bolt stood slid open and someone had rinsed black grit into my scullery sink. Whoever it was left faster than an old woman’s eyes could catch.',
        journalEntry: {
          id: 'j_margaret_sink',
          category: 'timeline',
          title: '11:35 PM Scullery Disturbance',
          body: 'Margaret found the cellar door unbolted and fresh coal grit in the scullery sink around 11:35 PM.'
        },
        choices: [{ id: 'mg_back1', text: 'I’ll inspect the cellar myself.', nextNodeId: 'root' }]
      },
      brandy_service: {
        id: 'brandy_service',
        speaker: 'Margaret Wells',
        portraitMood: 'calm',
        text: 'I poured his usual two fingers at ten o’clock—clean crystal, neat brandy. Dr. Reed insisted on carrying the glass upstairs himself, saying he wanted to check Mr. Blackwood’s pulse before bed.',
        journalEntry: {
          id: 'j_margaret_brandy',
          category: 'timeline',
          title: 'Reed Carried Edward’s Brandy',
          body: 'Margaret poured clean brandy at 10:00 PM, and Dr. Reed took it up to Edward’s study personally.'
        },
        choices: [{ id: 'mg_back2', text: 'Did Reed bring his medical bag?', nextNodeId: 'root' }]
      },
      blueprint_talk: {
        id: 'blueprint_talk',
        speaker: 'Margaret Wells',
        portraitMood: 'nervous',
        text: 'Lord preserve us... yes. Pull the rusted candle iron behind the empty burgundy rack in the cellar, and the whole timber frame pivots into the spiral climb behind the study bookcase. Dr. Reed asked me about those old servant walls back in October—claimed he was "interested in Victorian ventilation."',
        setsFlag: 'confronted_margaret',
        journalEntry: {
          id: 'j_margaret_lever',
          category: 'clue',
          title: 'How to Open the Basement Passage',
          body: 'Margaret explained that pulling the rusted iron sconce behind the Basement wine rack opens the spiral stair to Edward’s Study—and that Dr. Reed knew about the old passage.'
        },
        choices: [{ id: 'mg_back3', text: 'That changes everything.', nextNodeId: 'root' }]
      },
      towel_talk: {
        id: 'towel_talk',
        speaker: 'Margaret Wells',
        portraitMood: 'cold',
        text: 'Carbolic physician’s soap, sharp as ether, mixed with cellar coal. Nobody in this kitchen uses carbolic soap except Dr. Samuel Reed.',
        setsFlag: 'confronted_margaret',
        choices: [{ id: 'mg_back4', text: 'Thank you, Margaret.', nextNodeId: 'root' }]
      }
    }
  },

  victor: {
    id: 'victor',
    name: 'Victor Hale',
    role: 'Business Associate',
    age: 48,
    locationId: 'dining_room',
    spriteX: 1365,
    spriteY: 455,
    spriteHeight: 455,
    portraitPath: 'assets/characters/portraits/victor.png',
    spritePath: 'assets/characters/sprites/victor.png',
    personality: 'Sharp-tongued, cynical, pragmatic under pressure.',
    history:
      'Co-managed Blackwood Shipping for nine years. Recently falsified freight manifests to cover bad London commodity bets.',
    claimedAlibi: 'Claims he stood smoking under the terrace eaves outside the Dining Room.',
    motiveSummary: 'Embezzled £120,000 from Blackwood Industries; Edward threatened exposure.',
    secretSummary:
      'His seemingly flimsy alibi is actually true—while sheltering under the terrace stone arch at 11:32 PM, he looked up at the study bay window and saw a silhouette in wire-rimmed spectacles turn off the desk lamp.',
    relationships:
      'Hostile toward Thomas; wary of Dr. Reed; respectful of Detective Hayes.',
    coatColor: '#36322b',
    accentColor: '#7e6a47',
    hairColor: '#29292b',
    skinTone: '#caa890',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Victor exhales slowly. "Save the theatrical reveals for the courtroom, Hayes. Ask me straight."',
    presentReactions: {
      falsified_ledger: {
        text: 'Victor’s jaw tightens. "So you rifled my briefcase. Yes—I moved £120,000 to cover margin calls. Edward gave me until Monday to pay it back. Which means keeping Edward *alive* until Monday was the only thing standing between me and prison!"',
        setsFlag: 'confronted_victor',
        journalTitle: 'Victor Admits Embezzlement',
        journalBody:
          'Victor admits to embezzling £120,000—but insists Edward dying tonight ruins his repayment grace period.'
      },
      turkish_cigarette: {
        text: 'Victor taps his silver case. "Gold-tipped Turkish. Proof I really was freezing under those terrace stones in a gale. Now maybe you’ll listen to what I saw in the study window above me."',
        setsFlag: 'confronted_victor',
        journalTitle: 'Victor’s Terrace Alibi Corroborated',
        journalBody:
          'The dry Turkish cigarette confirms Victor was outside under the terrace eaves at 11:32 PM.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Victor Hale',
        portraitMood: 'guarded',
        text: 'I know how it looks, Detective. A man claims he stepped outside into a November thunderstorm just for a cigarette.',
        choices: [
          {
            id: 'vh_alibi',
            text: 'Why stand outdoors in a gale at half past eleven?',
            nextNodeId: 'terrace',
            tone: 'neutral'
          },
          {
            id: 'vh_ledger',
            text: '[Show Doctored Ledger] £120,000 missing, Hale. Did you silence Edward before he called Scotland Yard?',
            nextNodeId: 'ledger_confront',
            requiredClueId: 'falsified_ledger',
            tone: 'evidence'
          },
          {
            id: 'vh_cig',
            text: '[Show Turkish Cigarette] Your cigarette proves you stood under the eaves. What did you see above you?',
            nextNodeId: 'saw_window',
            requiredClueId: 'turkish_cigarette',
            tone: 'evidence'
          },
          {
            id: 'vh_leave',
            text: 'Stay where I can find you.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      terrace: {
        id: 'terrace',
        speaker: 'Victor Hale',
        portraitMood: 'guarded',
        text: 'Because the stone archway keeps the rain off while you think—and because nobody inside this damned house wanted to share a room with me after dinner.',
        choices: [{ id: 'vh_back1', text: 'Did you look up at the study window?', nextNodeId: 'hint_window' }]
      },
      hint_window: {
        id: 'hint_window',
        speaker: 'Victor Hale',
        portraitMood: 'cold',
        text: 'Look for my smoke outside that terrace door if you doubt I was there. Prove you trust my eyes, and I’ll tell you what silhouette crossed the study curtains.',
        choices: [{ id: 'vh_back2', text: 'I’ll inspect the terrace threshold.', nextNodeId: 'root' }]
      },
      ledger_confront: {
        id: 'ledger_confront',
        speaker: 'Victor Hale',
        portraitMood: 'nervous',
        text: 'Think like a detective, not a beat cop! Edward gave me seventy-two hours to return the funds before he went to the fraud squad. With him dead, the executors freeze every ledger tomorrow morning! Murdering Edward hangs me twice.',
        setsFlag: 'confronted_victor',
        choices: [{ id: 'vh_back3', text: 'Then tell me who benefitted tonight.', nextNodeId: 'root' }]
      },
      saw_window: {
        id: 'saw_window',
        speaker: 'Victor Hale',
        portraitMood: 'calm',
        text: 'At roughly eleven-thirty—right as lightning hit the ridge—I glanced up at the study bay window. A man stood over Edward’s desk in a dark tailored coat. Then a round glint caught the green lamp—spectacles—and half a second later the lamp snapped dark.',
        setsFlag: 'confronted_victor',
        journalEntry: {
          id: 'j_victor_witness',
          category: 'timeline',
          title: 'Victor Saw Spectacles in the Study (~11:32 PM)',
          body: 'From the stone terrace, Victor witnessed a man wearing spectacles leaning over Edward’s desk just before the study lamp clicked off around 11:32 PM.'
        },
        choices: [{ id: 'vh_back4', text: 'Spectacles... and the lamp went out at 11:32.', nextNodeId: 'root' }]
      }
    }
  },

  clara: {
    id: 'clara',
    name: 'Clara Blackwood',
    role: 'Daughter of Edward Blackwood',
    age: 22,
    locationId: 'library',
    spriteX: 1170,
    spriteY: 420,
    spriteHeight: 340,
    portraitPath: 'assets/characters/portraits/clara.png',
    spritePath: 'assets/characters/sprites/clara.png',
    personality: 'Quiet, unsentimental, hyper-observant.',
    history:
      'Returned from London art school three weeks ago after learning her father was dying. Spent her evenings sketching unnoticed in dark corners.',
    claimedAlibi: 'Claims she was reading in the Library alcove all evening.',
    motiveSummary: 'Estranged from her father’s cold authority; inherits Blackwood Manor.',
    secretSummary:
      'She drew Dr. Reed washing soot and blood at the scullery sink at 11:36 PM, and overheard Edward arguing with Reed about "the 1992 Hayes report" before dinner.',
    relationships:
      'Quietly sympathetic toward Margaret; suspicious of Dr. Reed; distant from Eleanor.',
    coatColor: '#25312c',
    accentColor: '#8fa399',
    hairColor: '#1d191a',
    skinTone: '#dfcbbd',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Clara studies the object like an artist studying shadow. "People drop things when they believe nobody is watching."',
    presentReactions: {
      clara_sketchbook: {
        text: 'Clara looks at the open charcoal page and doesn’t flinch. "11:36 PM. I stepped toward the kitchen for water and saw Dr. Reed scrubbing his cuffs under the scullery tap. His spectacles caught the stove ember. That’s why I kept quiet—a witness only stays safe when nobody knows she saw."',
        setsFlag: 'confronted_clara',
        journalTitle: 'Clara Identifies Dr. Reed at 11:36 PM',
        journalBody:
          'Clara confirmed her 11:36 PM sketch: she saw Dr. Samuel Reed secretly scrubbing black soot from his hands in the Kitchen.'
      },
      case_1992_dossier: {
        text: 'Clara closes her eyes briefly. "So that was why Father summoned you. Earlier tonight I heard him shouting at Dr. Reed behind the study door: \'I won’t let Arthur Hayes carry my stain into my grave, Samuel!\'"',
        setsFlag: 'confronted_clara',
        journalTitle: 'Clara Overheard Edward & Reed',
        journalBody:
          'Clara overheard Edward telling Dr. Reed he intended to clear Detective Hayes’s name tonight.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Clara Blackwood',
        portraitMood: 'calm',
        text: 'Everyone downstairs is performing grief, Detective. You don’t look like a man easily fooled by theater.',
        choices: [
          {
            id: 'cl_cold',
            text: 'You seem remarkably composed for a daughter whose father was just killed.',
            nextNodeId: 'detached',
            tone: 'press'
          },
          {
            id: 'cl_alibi',
            text: 'Were you in the Library all evening?',
            nextNodeId: 'alibi',
            tone: 'neutral'
          },
          {
            id: 'cl_sketch',
            text: '[Show Charcoal Sketchbook] Who was at the scullery sink at 11:36 PM, Clara?',
            nextNodeId: 'sketch_confess',
            requiredClueId: 'clara_sketchbook',
            tone: 'evidence'
          },
          {
            id: 'cl_dossier',
            text: '[Show 1992 Dossier] Did your father ever mention this police inquiry?',
            nextNodeId: 'dossier_confess',
            requiredClueId: 'case_1992_dossier',
            tone: 'evidence'
          },
          {
            id: 'cl_leave',
            text: 'Keep safe, Miss Blackwood.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      detached: {
        id: 'detached',
        speaker: 'Clara Blackwood',
        portraitMood: 'cold',
        text: 'Dr. Reed told me three weeks ago Father’s heart wouldn’t see spring. I buried him in my head last month. Tonight merely spared him the slow decay—and proved how ruthless his physician really is when cornered.',
        choices: [
          {
            id: 'cl_ruthless',
            text: 'That’s a serious accusation about Dr. Reed. What did you see?',
            nextNodeId: 'hint_sketch',
            tone: 'press'
          },
          { id: 'cl_back1', text: 'I understand.', nextNodeId: 'root' }
        ]
      },
      hint_sketch: {
        id: 'hint_sketch',
        speaker: 'Clara Blackwood',
        portraitMood: 'guarded',
        text: 'Look behind the window cushion where I was sitting. My pencil remembers details people try to wash away.',
        choices: [{ id: 'cl_back2', text: 'I’ll look closely.', nextNodeId: 'root' }]
      },
      alibi: {
        id: 'alibi',
        speaker: 'Clara Blackwood',
        portraitMood: 'calm',
        text: 'Nearly all night, except for five minutes around eleven-thirty-five when I walked down the service passage for a glass of water—and stopped dead in the doorway.',
        choices: [{ id: 'cl_back3', text: 'Why did you stop?', nextNodeId: 'hint_sketch' }]
      },
      sketch_confess: {
        id: 'sketch_confess',
        speaker: 'Clara Blackwood',
        portraitMood: 'guarded',
        text: 'Dr. Samuel Reed. He didn’t know I stood in the pantry shadow. At 11:36 PM he was scrubbing black cellar dust off his cuffs with carbolic soap—twelve minutes before Thomas yelled outside the study.',
        setsFlag: 'confronted_clara',
        journalEntry: {
          id: 'j_clara_witness',
          category: 'conversation',
          title: 'Clara Saw Dr. Reed at 11:36 PM',
          body: 'Clara saw Dr. Reed washing coal dust from his hands in the Kitchen scullery at 11:36 PM.'
        },
        choices: [{ id: 'cl_back4', text: 'Thank you for telling me the truth.', nextNodeId: 'root' }]
      },
      dossier_confess: {
        id: 'dossier_confess',
        speaker: 'Clara Blackwood',
        portraitMood: 'calm',
        text: 'Before dinner, Father told Dr. Reed he was handing the 1992 Miller files to you before midnight. Reed’s face turned grey as candle wax. I’ve never seen a doctor look so terrified of a dying patient.',
        setsFlag: 'confronted_clara',
        journalEntry: {
          id: 'j_clara_overheard',
          category: 'suspect',
          title: 'Edward Threatened to Expose Reed Tonight',
          body: 'Clara heard Edward tell Dr. Reed before dinner that he would hand the 1992 files to Detective Hayes tonight.'
        },
        choices: [{ id: 'cl_back5', text: 'You’ve given me the final piece of the motive.', nextNodeId: 'root' }]
      }
    }
  },

  reed: {
    id: 'reed',
    name: 'Dr. Samuel Reed',
    role: 'Personal Physician',
    age: 49,
    locationId: 'guest_bedroom',
    spriteX: 435,
    spriteY: 415,
    spriteHeight: 435,
    portraitPath: 'assets/characters/portraits/reed.png',
    spritePath: 'assets/characters/sprites/reed.png',
    personality: 'Articulate, clinical, eerily calm—until cornered with physical facts.',
    history:
      'Served as Blackwood family physician for eight years. In 1992, secretly took payment from Edward to alter a coroner toxicology report—the scandal that ruined Detective Arthur Hayes.',
    claimedAlibi:
      'Claims he retired to the Guest Bedroom at 11:00 PM with a migraine, drank hot chamomile tea, and never left until Thomas shouted at 11:47 PM.',
    motiveSummary:
      'Edward planned to hand Arthur Hayes the 1992 Toxicology Dossier tonight—exposing Reed’s felony falsification and destroying his medical career and freedom.',
    secretSummary:
      'THE CULPRIT: Sedated Edward’s 10:00 PM/11:15 PM brandy with Chloral Hydrate, struck him with the brass paperweight at 11:32 PM, bolted the study from within, escaped via the 1920 secret staircase to the Basement, dumped the study key in the coal furnace, and washed off the soot in the Kitchen at 11:36 PM.',
    relationships:
      'Ostensibly deferential to the family; privately terrified of Edward’s deathbed confession to Arthur Hayes.',
    coatColor: '#1f2329',
    accentColor: '#8d99a6',
    hairColor: '#3b3c40',
    skinTone: '#d3c2b4',
    rootNodeId: 'root',
    defaultPresentReaction:
      'Dr. Reed polishes his wire-rimmed glasses calmly. "An interesting curiosity, Detective, though hardly clinical proof."',
    presentReactions: {
      medical_bag_vial: {
        text: 'Reed’s smile vanishes for a fraction of a second. "Chloral hydrate is standard insomnia sedation for terminal patients, Hayes. If Edward kept an old dose in his desk, you can scarcely lay that at my door."',
        setsFlag: 'confronted_reed',
        journalTitle: 'Reed Deflects the Chloral Hydrate',
        journalBody:
          'Dr. Reed claimed Chloral Hydrate was merely for Edward’s insomnia, refusing to explain the freshly broken seal.'
      },
      case_1992_dossier: {
        text: 'Dr. Reed goes utterly still behind his spectacles. "So Edward kept those papers after all... Be careful what ghosts you exhume, Hayes. Even a disgraced detective needs airtight evidence before accusing a respected physician."',
        setsFlag: 'confronted_reed',
        journalTitle: 'Reed Cornered on the 1992 Dossier',
        journalBody:
          'When shown the 1992 Toxicology Dossier, Dr. Reed dropped his clinical warmth and issued a veiled warning.'
      }
    },
    nodes: {
      root: {
        id: 'root',
        speaker: 'Dr. Samuel Reed',
        portraitMood: 'calm',
        text: 'Detective Hayes. Tragic night. Edward’s heart was already failing, though clearly someone chose a far cruder instrument than nature.',
        choices: [
          {
            id: 'rd_alibi',
            text: 'Walk me through your evening after ten o’clock, Doctor.',
            nextNodeId: 'alibi',
            tone: 'neutral'
          },
          {
            id: 'rd_teacup',
            text: '[Show Cold Tea & Clock] Your tea has been cold for an hour, and your oxfords have coal soot on the welts.',
            nextNodeId: 'alibi_break',
            requiredClueId: 'guest_room_teacup',
            tone: 'evidence'
          },
          {
            id: 'rd_vial',
            text: '[Show Chloral Hydrate Bottle] Why is tonight’s seal broken on a sedative matching Edward’s brandy?',
            nextNodeId: 'vial_confront',
            requiredClueId: 'medical_bag_vial',
            tone: 'evidence'
          },
          {
            id: 'rd_dossier',
            text: '[Show 1992 Dossier] Edward brought me here to expose what you forged in 1992.',
            nextNodeId: 'dossier_confront',
            requiredClueId: 'case_1992_dossier',
            tone: 'evidence'
          },
          {
            id: 'rd_leave',
            text: 'We’ll continue this shortly, Doctor.',
            nextNodeId: 'EXIT'
          }
        ]
      },
      alibi: {
        id: 'alibi',
        speaker: 'Dr. Samuel Reed',
        portraitMood: 'calm',
        text: 'I carried Edward his evening brandy at ten, retired here to the Guest Bedroom by eleven with a blinding migraine, sipped chamomile tea, and rested until Thomas’s shouting woke the corridor at 11:47.',
        journalEntry: {
          id: 'j_reed_alibi',
          category: 'suspect',
          title: 'Dr. Reed’s Claimed Alibi',
          body: 'Dr. Reed claims he retired to the Guest Bedroom at 11:00 PM with tea and a migraine until 11:47 PM.'
        },
        choices: [{ id: 'rd_back1', text: 'Convenient that nobody checked on you.', nextNodeId: 'root' }]
      },
      alibi_break: {
        id: 'alibi_break',
        speaker: 'Dr. Samuel Reed',
        portraitMood: 'guarded',
        text: 'A physician’s shoes pick up dust anywhere in an old country house, Detective—and I fell asleep before finishing my tea. Neither detail puts me inside a locked study across the hall.',
        setsFlag: 'confronted_reed',
        choices: [{ id: 'rd_back2', text: 'Not unless there’s another way into that study.', nextNodeId: 'root' }]
      },
      vial_confront: {
        id: 'vial_confront',
        speaker: 'Dr. Samuel Reed',
        portraitMood: 'nervous',
        text: 'You broke into my private medical kit? Careless, Hayes. Yes, I prescribed mild sedatives for Edward’s insomnia—that proves I am his doctor, not his killer.',
        setsFlag: 'confronted_reed',
        choices: [{ id: 'rd_back3', text: 'A sedative strong enough to drop him at his desk.', nextNodeId: 'root' }]
      },
      dossier_confront: {
        id: 'dossier_confront',
        speaker: 'Dr. Samuel Reed',
        portraitMood: 'cold',
        text: 'Edward was dying and losing his mind to guilt. Nobody in London would have believed an old, uncorroborated file from a disgraced inspector anyway. If you intend to point your finger tonight, Hayes, you’d better be certain you can explain how I left a bolted room.',
        setsFlag: 'confronted_reed',
        journalEntry: {
          id: 'j_reed_challenge',
          category: 'question',
          title: 'Reed’s Final Challenge',
          body: 'Dr. Reed challenged Arthur to prove the motive, sedative match, and locked-room escape together.'
        },
        choices: [{ id: 'rd_back4', text: 'Oh, I intend to.', nextNodeId: 'root' }]
      }
    }
  }
};

export const CHARACTER_LIST: CharacterDefinition[] = Object.values(CHARACTERS);
