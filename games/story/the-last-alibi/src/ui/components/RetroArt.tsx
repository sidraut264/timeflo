import React, { useState } from 'react';
import { CHARACTERS } from '../../data/characters/characters';
import { CLUES } from '../../data/clues/clues';
import { getAssetManifestSync } from '../../game/systems/AssetManifestLoader';
import { CharacterId } from '../../types/game';

interface PortraitProps {
  characterId: CharacterId;
  mood?: 'calm' | 'guarded' | 'nervous' | 'cold';
  className?: string;
}

export const CharacterPortrait: React.FC<PortraitProps> = ({
  characterId,
  mood = 'calm',
  className = ''
}) => {
  const char = CHARACTERS[characterId];
  const [imgFailed, setImgFailed] = useState(false);
  if (!char) return null;

  const customPortraitUrl = getAssetManifestSync().portraits[characterId];
  if (customPortraitUrl && !imgFailed) {
    return (
      <div className={`retro-portrait ${className}`}>
        <img
          src={customPortraitUrl}
          loading="lazy"
          decoding="async"
          alt={char.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  const browTilt =
    mood === 'nervous' ? 3 : mood === 'cold' ? -4 : mood === 'guarded' ? -2 : 0;

  return (
    <div className={`retro-portrait ${className}`}>
      <svg viewBox="0 0 160 200" width="100%" height="100%" aria-label={char.name}>
        <defs>
          <radialGradient id={`bg_${characterId}`} cx="55%" cy="35%" r="72%">
            <stop offset="0%" stopColor="#3c2a1b" />
            <stop offset="65%" stopColor="#161210" />
            <stop offset="100%" stopColor="#08080a" />
          </radialGradient>
          <linearGradient id={`rim_${characterId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(224,185,112,0.38)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        <rect width="160" height="200" fill={`url(#bg_${characterId})`} />

        {/* Subtle chiaroscuro halo */}
        <circle cx="84" cy="78" r="56" fill="rgba(201,151,70,0.09)" />

        {/* Shoulders & coat */}
        <path
          d="M 18 200 L 34 134 Q 80 116 126 134 L 142 200 Z"
          fill={char.coatColor}
          stroke="#0d0a08"
          strokeWidth="2"
        />
        {/* Shirt / Ascot / Scarf */}
        <path d="M 65 128 L 80 164 L 95 128 Z" fill={char.accentColor} opacity="0.85" />

        {/* Neck */}
        <rect x="69" y="102" width="22" height="30" rx="6" fill={char.skinTone} />
        <path d="M 69 108 Q 80 122 91 108" fill="rgba(0,0,0,0.28)" />

        {/* Face */}
        <ellipse cx="80" cy="78" rx="28" ry="35" fill={char.skinTone} />
        {/* Shadow side of face */}
        <path
          d="M 80 43 A 28 35 0 0 1 80 113 Q 94 98 94 78 Q 94 58 80 43 Z"
          fill="rgba(16, 10, 8, 0.25)"
        />

        {/* Hair */}
        {characterId === 'eleanor' || characterId === 'margaret' || characterId === 'clara' ? (
          <>
            <path
              d="M 49 74 Q 48 36 80 35 Q 112 36 111 74 Q 103 52 80 51 Q 57 52 49 74 Z"
              fill={char.hairColor}
            />
            {characterId === 'clara' && (
              <path d="M 50 68 L 46 118 L 58 112 Z M 110 68 L 114 118 L 102 112 Z" fill={char.hairColor} />
            )}
            {characterId === 'margaret' && (
              <circle cx="80" cy="34" r="11" fill={char.hairColor} />
            )}
          </>
        ) : (
          <path
            d="M 51 70 Q 52 38 80 38 Q 108 38 109 70 Q 100 50 80 50 Q 60 50 51 70 Z"
            fill={char.hairColor}
          />
        )}

        {/* Eyes & brows */}
        <g transform={`translate(0, 0)`}>
          <path
            d={`M 60 ${67 + browTilt} Q 67 ${63} 74 ${66 - browTilt * 0.4}`}
            stroke="#1b1410"
            strokeWidth="2.4"
            fill="none"
          />
          <path
            d={`M 86 ${66 - browTilt * 0.4} Q 93 ${63} 100 ${67 + browTilt}`}
            stroke="#1b1410"
            strokeWidth="2.4"
            fill="none"
          />
          <ellipse cx="67" cy="74" rx="4.2" ry="2.6" fill="#181412" />
          <ellipse cx="93" cy="74" rx="4.2" ry="2.6" fill="#181412" />
          <circle cx="66" cy="73.3" r="1" fill="#efe2c4" />
          <circle cx="92" cy="73.3" r="1" fill="#efe2c4" />
        </g>

        {/* Nose & Mouth */}
        <path d="M 80 73 L 77 88 L 83 89" stroke="rgba(45,25,18,0.5)" strokeWidth="1.8" fill="none" />
        <path
          d={mood === 'nervous' ? 'M 71 99 Q 80 96 89 99' : 'M 70 98 Q 80 100 90 98'}
          stroke="#4f2924"
          strokeWidth="2.2"
          fill="none"
        />

        {/* Distinguishing Noir Props */}
        {characterId === 'reed' && (
          <g stroke="#d4b572" strokeWidth="1.6" fill="rgba(220,235,245,0.08)">
            <circle cx="67" cy="74" r="8.5" />
            <circle cx="93" cy="74" r="8.5" />
            <line x1="75.5" y1="74" x2="84.5" y2="74" />
            <path d="M 67 93 Q 80 116 93 93" fill="rgba(35,34,38,0.45)" stroke="none" />
          </g>
        )}
        {characterId === 'eleanor' && (
          <circle cx="51" cy="87" r="3" fill="#e8e2d0" />
        )}
        {characterId === 'margaret' && (
          <circle cx="80" cy="134" r="3.5" fill="#c7ccd1" stroke="#474d52" strokeWidth="1" />
        )}

        {/* Frame vignette & rim */}
        <rect
          x="3"
          y="3"
          width="154"
          height="194"
          fill="none"
          stroke="rgba(189,149,78,0.45)"
          strokeWidth="2"
        />
        <rect width="160" height="200" fill={`url(#rim_${characterId})`} opacity="0.25" />
      </svg>
    </div>
  );
};

interface ClueArtProps {
  clueId: string;
  size?: number;
}

export const ClueIllustration: React.FC<ClueArtProps> = ({ clueId, size = 72 }) => {
  const clue = CLUES[clueId];
  const [imgFailed, setImgFailed] = useState(false);
  if (!clue) return null;

  const customClueUrl = getAssetManifestSync().clues[clueId];
  if (customClueUrl && !imgFailed) {
    return (
      <img
        src={customClueUrl}
        loading="lazy"
        decoding="async"
        alt={clue.name}
        width={size}
        height={size}
        className="clue-illustration"
        style={{ objectFit: 'cover', borderRadius: 6, border: '2px solid #5a4326' }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className="clue-illustration"
      aria-label={clue.name}
    >
      <defs>
        <radialGradient id={`clue_bg_${clueId}`} cx="48%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#322518" />
          <stop offset="100%" stopColor="#100d0b" />
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="6" fill={`url(#clue_bg_${clueId})`} stroke="#5a4326" strokeWidth="2" />

      {clue.iconKind === 'telegram' && (
        <g>
          <rect x="18" y="24" width="60" height="46" rx="2" fill="#d9c69e" stroke="#695031" strokeWidth="2" />
          <line x1="25" y1="34" x2="70" y2="34" stroke="#453321" strokeWidth="2.5" />
          <line x1="25" y1="43" x2="66" y2="43" stroke="#453321" strokeWidth="2" />
          <line x1="25" y1="51" x2="60" y2="51" stroke="#453321" strokeWidth="2" />
          <circle cx="63" cy="58" r="6" fill="#7c2020" opacity="0.7" />
        </g>
      )}

      {clue.iconKind === 'watch' && (
        <g>
          <circle cx="48" cy="52" r="24" fill="#c79b42" stroke="#594015" strokeWidth="3" />
          <circle cx="48" cy="52" r="19" fill="#e5d7b8" />
          <rect x="44" y="20" width="8" height="8" fill="#c79b42" />
          <circle cx="48" cy="18" r="5" fill="none" stroke="#c79b42" strokeWidth="2.5" />
          <line x1="48" y1="52" x2="43" y2="39" stroke="#1c1610" strokeWidth="2.4" />
          <line x1="48" y1="52" x2="36" y2="57" stroke="#1c1610" strokeWidth="2" />
          <polyline points="36,41 47,50 59,44 55,61" fill="none" stroke="#614933" strokeWidth="1.2" />
        </g>
      )}

      {clue.iconKind === 'paperweight' && (
        <g>
          <rect x="24" y="60" width="48" height="14" rx="2" fill="#b38834" stroke="#4f3711" strokeWidth="2" />
          <path d="M 32 60 Q 34 32 50 28 Q 66 30 62 60 Z" fill="#c99b42" stroke="#4f3711" strokeWidth="2" />
          <path d="M 30 68 Q 48 73 66 69" stroke="#6e161a" strokeWidth="3" fill="none" />
        </g>
      )}

      {clue.iconKind === 'glass' && (
        <g>
          <path d="M 32 24 L 64 24 Q 68 54 48 56 Q 28 54 32 24 Z" fill="rgba(186,204,214,0.22)" stroke="#b8c4cc" strokeWidth="2" />
          <path d="M 33 42 Q 48 45 63 42 Q 61 54 48 55 Q 35 54 33 42 Z" fill="#9c5a20" />
          <rect x="46" y="56" width="4" height="16" fill="#b8c4cc" />
          <ellipse cx="48" cy="73" rx="14" ry="4" fill="#b8c4cc" />
          <circle cx="45" cy="51" r="2" fill="#eceae4" />
          <circle cx="52" cy="52" r="1.5" fill="#eceae4" />
        </g>
      )}

      {clue.iconKind === 'vial' && (
        <g>
          <rect x="35" y="34" width="26" height="40" rx="5" fill="#6b3410" stroke="#c99b52" strokeWidth="2" />
          <rect x="41" y="22" width="14" height="12" fill="#8f5122" />
          <rect x="42" y="16" width="12" height="6" fill="#c7b28f" />
          <rect x="37" y="46" width="22" height="14" fill="#dfd2b4" />
          <line x1="40" y1="51" x2="56" y2="51" stroke="#301e10" strokeWidth="2" />
          <line x1="40" y1="56" x2="52" y2="56" stroke="#7c1b1b" strokeWidth="1.5" />
        </g>
      )}

      {(clue.iconKind === 'dossier' || clue.iconKind === 'will' || clue.iconKind === 'ledger') && (
        <g>
          <rect x="22" y="18" width="52" height="62" rx="3" fill={clue.iconKind === 'ledger' ? '#4a1b1f' : '#b89a67'} stroke="#3a2917" strokeWidth="2" />
          <rect x="27" y="24" width="42" height="50" fill="#dfd2b5" opacity="0.88" />
          <line x1="33" y1="34" x2="63" y2="34" stroke="#2f251b" strokeWidth="2.5" />
          <line x1="33" y1="43" x2="61" y2="43" stroke="#524231" strokeWidth="1.8" />
          <line x1="33" y1="51" x2="58" y2="51" stroke="#524231" strokeWidth="1.8" />
          <rect x="34" y="59" width="24" height="8" fill="none" stroke="#7d1c1c" strokeWidth="1.8" />
        </g>
      )}

      {clue.iconKind === 'key' && (
        <g transform="rotate(-32 48 48)">
          <circle cx="30" cy="48" r="11" fill="none" stroke="#cfa44e" strokeWidth="4" />
          <line x1="41" y1="48" x2="74" y2="48" stroke="#cfa44e" strokeWidth="4" />
          <line x1="62" y1="48" x2="62" y2="58" stroke="#cfa44e" strokeWidth="3.5" />
          <line x1="70" y1="48" x2="70" y2="60" stroke="#cfa44e" strokeWidth="3.5" />
        </g>
      )}

      {clue.iconKind === 'blueprint' && (
        <g>
          <rect x="16" y="24" width="64" height="48" fill="#1e3c5a" stroke="#9ac0e0" strokeWidth="2" />
          <rect x="24" y="32" width="48" height="32" fill="none" stroke="#9ac0e0" strokeWidth="1.5" />
          <line x1="48" y1="32" x2="48" y2="64" stroke="#9ac0e0" strokeWidth="1.2" />
          <path d="M 32 54 Q 48 38 66 44" stroke="#d94e4e" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        </g>
      )}

      {clue.iconKind === 'footprint' && (
        <g fill="#5b626b" stroke="#9ea7b3" strokeWidth="1.5">
          <ellipse cx="42" cy="36" rx="9" ry="15" transform="rotate(-14 42 36)" />
          <rect x="38" y="52" width="12" height="11" rx="3" transform="rotate(-14 44 57)" />
          <ellipse cx="62" cy="54" rx="7" ry="12" transform="rotate(-12 62 54)" opacity="0.7" />
        </g>
      )}

      {clue.iconKind === 'sketchbook' && (
        <g>
          <rect x="20" y="20" width="56" height="56" fill="#d9ceb4" stroke="#4f3d28" strokeWidth="2" />
          <circle cx="48" cy="43" r="10" fill="none" stroke="#222" strokeWidth="2" />
          <circle cx="44" cy="42" r="3" fill="none" stroke="#222" strokeWidth="1.5" />
          <circle cx="52" cy="42" r="3" fill="none" stroke="#222" strokeWidth="1.5" />
          <path d="M 32 68 Q 48 52 64 68" stroke="#222" strokeWidth="2" fill="none" />
        </g>
      )}

      {clue.iconKind === 'handkerchief' && (
        <g>
          <polygon points="22,30 68,22 74,64 28,74" fill="#e2dac8" stroke="#968970" strokeWidth="2" />
          <text x="41" y="54" fill="#632227" fontSize="13" fontFamily="serif" fontStyle="italic">
            E.B.
          </text>
        </g>
      )}

      {clue.iconKind === 'cigarette' && (
        <g transform="rotate(-24 48 48)">
          <rect x="22" y="43" width="38" height="10" fill="#e6e1d6" stroke="#857d6e" strokeWidth="1.5" />
          <rect x="60" y="43" width="14" height="10" fill="#c79546" />
          <circle cx="20" cy="48" r="5" fill="#4f4d4a" />
        </g>
      )}

      {clue.iconKind === 'note' && (
        <g>
          <path d="M 22 24 L 68 20 L 74 68 L 46 74 L 24 62 Z" fill="#cbb994" stroke="#47341e" strokeWidth="2" />
          <path d="M 52 72 Q 66 64 74 52 L 74 68 Z" fill="#1d1815" />
          <line x1="30" y1="36" x2="60" y2="34" stroke="#362717" strokeWidth="2" />
          <line x1="30" y1="46" x2="56" y2="44" stroke="#362717" strokeWidth="2" />
        </g>
      )}

      {clue.iconKind === 'washcloth' && (
        <g>
          <path d="M 26 24 L 70 28 L 66 72 L 24 68 Z" fill="#cbc6ba" stroke="#6b665d" strokeWidth="2" />
          <ellipse cx="48" cy="48" rx="14" ry="10" fill="#2c2d30" opacity="0.6" />
          <ellipse cx="52" cy="54" rx="7" ry="4" fill="#702323" opacity="0.55" />
        </g>
      )}

      {clue.iconKind === 'poker' && (
        <g transform="rotate(-40 48 48)">
          <rect x="16" y="45" width="60" height="6" rx="2" fill="#6d737a" />
          <circle cx="76" cy="48" r="6" fill="none" stroke="#9ea5ad" strokeWidth="3" />
          <path d="M 16 48 L 10 38" stroke="#6d737a" strokeWidth="4" />
        </g>
      )}

      {clue.iconKind === 'teacup' && (
        <g>
          <path d="M 28 40 L 64 40 Q 62 66 46 66 Q 30 66 28 40 Z" fill="#dfd9cc" stroke="#7a7367" strokeWidth="2" />
          <path d="M 64 44 Q 74 44 74 52 Q 74 60 62 58" fill="none" stroke="#dfd9cc" strokeWidth="3" />
          <ellipse cx="46" cy="70" rx="24" ry="5" fill="#c7bfb0" />
        </g>
      )}
    </svg>
  );
};
