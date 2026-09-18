/**
 * PieceRenderer — Inline SVG piece visual system for Chess 2.
 *
 * All pieces are rendered as inline SVG for crisp scaling at any board size.
 * No external assets, no raster images, no third-party libraries.
 *
 * Design aesthetic: "premium modern strategy board game"
 * - Elegant, slightly dramatic silhouettes
 * - Clear ownership through fill gradient + rim treatment
 * - Readable at all board sizes via responsive viewBox
 *
 * IMPORTANT: This file contains ONLY visual rendering code.
 * It does not calculate any game rules.
 */

import { PieceType } from '../game/Piece';
import { Player } from '../game/Player';

// ── Ownership palette ─────────────────────────────────────────────────────────
// White: ivory body with warm highlights, dark stroke for readability on light squares
// Black: charcoal body with subtle highlights, lighter stroke for dark square readability

interface OwnerColors {
  body: string;
  bodyDark: string;
  highlight: string;
  stroke: string;
  rim: string;
  shadow: string;
}

const WHITE_COLORS: OwnerColors = {
  body:      '#f5ede0',
  bodyDark:  '#ddc9aa',
  highlight: '#fffaf5',
  stroke:    '#5c3d1e',
  rim:       '#c4a882',
  shadow:    'rgba(60,30,0,0.35)',
};

const BLACK_COLORS: OwnerColors = {
  body:      '#2a2630',
  bodyDark:  '#1a1720',
  highlight: '#4a4460',
  stroke:    '#c8b8e8',
  rim:       '#5a5080',
  shadow:    'rgba(0,0,0,0.55)',
};

function colors(owner: Player): OwnerColors {
  return owner === Player.White ? WHITE_COLORS : BLACK_COLORS;
}

// ── SVG wrapper helpers ────────────────────────────────────────────────────────
function svgWrap(content: string, extra = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" role="img" aria-hidden="true" focusable="false" ${extra}>${content}</svg>`;
}

function shadow(c: OwnerColors): string {
  return `<ellipse cx="20" cy="45" rx="13" ry="2.5" fill="${c.shadow}"/>`;
}

function rim(c: OwnerColors, y = 40, w = 26): string {
  const x = (40 - w) / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.6"/>`;
}

// ── Pawn ──────────────────────────────────────────────────────────────────────
function pawnSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 37, 22)}
    <rect x="9" y="33" width="22" height="6" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <rect x="13" y="28" width="14" height="7" rx="1.5" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="20" cy="20" r="9" fill="${c.body}" stroke="${c.stroke}" stroke-width="1"/>
    <circle cx="17.5" cy="17.5" r="3" fill="${c.highlight}" opacity="0.5"/>
  `);
}

// ── Rook ──────────────────────────────────────────────────────────────────────
function rookSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 28)}
    <rect x="6" y="32" width="28" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="10" y="20" width="20" height="14" rx="1" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="8" y="14" width="24" height="8" rx="1.5" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="8"  y="10" width="5" height="6" rx="1" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <rect x="17.5" y="10" width="5" height="6" rx="1" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <rect x="27" y="10" width="5" height="6" rx="1" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <rect x="16" y="20" width="2" height="12" fill="${c.highlight}" opacity="0.25"/>
  `);
}

// ── Bishop ────────────────────────────────────────────────────────────────────
function bishopSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 24)}
    <rect x="8" y="32" width="24" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="12" y="28" width="16" height="6" rx="2" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.7"/>
    <ellipse cx="20" cy="22" rx="8" ry="8" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8"/>
    <path d="M20 8 L23 18 L17 18 Z" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8" stroke-linejoin="round"/>
    <circle cx="20" cy="8" r="2.5" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="17" cy="18" r="2" fill="${c.highlight}" opacity="0.4"/>
  `);
}

// ── Knight ────────────────────────────────────────────────────────────────────
function knightSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 26)}
    <rect x="7" y="32" width="26" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="11" y="27" width="18" height="7" rx="2" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.7"/>
    <path d="M13 28 C10 22 10 14 14 10 C16 8 20 7 23 9 C27 11 28 16 26 20 C24 24 22 26 20 27 Z"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M14 10 C12 8 11 6 13 5 C15 4 17 6 16 8" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.6"/>
    <circle cx="22" cy="13" r="2.2" fill="${c.highlight}" opacity="0.45"/>
    <ellipse cx="17" cy="19" rx="2" ry="1.5" fill="${c.stroke}" opacity="0.5"/>
    <path d="M16 23 L18 22 L16 24 Z" fill="${c.bodyDark}" opacity="0.7"/>
  `);
}

// ── Queen ─────────────────────────────────────────────────────────────────────
function queenSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 28)}
    <rect x="6" y="32" width="28" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.8"/>
    <path d="M9 32 C9 22 13 16 20 14 C27 16 31 22 31 32 Z"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8" stroke-linejoin="round"/>
    <rect x="11" y="29" width="18" height="4" rx="1" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.5"/>
    <path d="M12 15 L9 8 L14 13 L20 6 L26 13 L31 8 L28 15"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.9" stroke-linejoin="round"/>
    <circle cx="9"  cy="8"  r="2.5" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="20" cy="6"  r="2.5" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="31" cy="8"  r="2.5" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="14" cy="13" r="2"   fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.6"/>
    <circle cx="26" cy="13" r="2"   fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.6"/>
    <circle cx="15" cy="19" r="2.5" fill="${c.highlight}" opacity="0.4"/>
  `);
}

// ── King ──────────────────────────────────────────────────────────────────────
function kingSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 30)}
    <rect x="5" y="32" width="30" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.9"/>
    <path d="M8 32 C8 21 12 14 20 12 C28 14 32 21 32 32 Z"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.9" stroke-linejoin="round"/>
    <rect x="11" y="28" width="18" height="4" rx="1" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.5"/>
    <path d="M12 14 L8 6 L15 11 L20 4 L25 11 L32 6 L28 14"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="1" stroke-linejoin="round"/>
    <rect x="18" y="3" width="4" height="10" rx="1.5" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8"/>
    <rect x="15" y="7" width="10" height="4"  rx="1.5" fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8"/>
    <circle cx="8"  cy="6"  r="2.5" fill="${c.rim}"      stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="32" cy="6"  r="2.5" fill="${c.rim}"      stroke="${c.stroke}" stroke-width="0.7"/>
    <circle cx="20" cy="3"  r="2"   fill="${c.highlight}" opacity="0.8"/>
    <circle cx="14" cy="17" r="3"   fill="${c.highlight}" opacity="0.35"/>
  `);
}

// ── Minister (unique Chess 2 piece) ──────────────────────────────────────────
// Visual concept: Royal Commander / Tactician — carries a command staff
function ministerSVG(owner: Player): string {
  const c = colors(owner);
  const accentColor = owner === Player.White ? '#c8a060' : '#8070d0';
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 28)}
    <rect x="6" y="32" width="28" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.8"/>
    <path d="M10 32 C9 24 11 18 16 14 C18 12 20 12 22 12 C26 13 29 18 31 24 L31 32 Z"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8" stroke-linejoin="round"/>
    <rect x="12" y="28" width="16" height="4" rx="1" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.5"/>
    <path d="M16 13 L18 8 L20 5 L22 8 L24 13"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.7" stroke-linejoin="round"/>
    <path d="M14 9 L26 9" stroke="${c.stroke}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M16 7 L24 7" stroke="${accentColor}" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="18.5" y="5" width="3" height="5" rx="0.5" fill="${accentColor}" stroke="${c.stroke}" stroke-width="0.5"/>
    <rect x="27" y="14" width="3" height="18" rx="1" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <ellipse cx="28.5" cy="13" rx="3" ry="2" fill="${accentColor}" stroke="${c.stroke}" stroke-width="0.6"/>
    <path d="M11 21 L13 19 L15 21 L13 23 Z" fill="${accentColor}" opacity="0.7"/>
    <circle cx="15" cy="17" r="2" fill="${c.highlight}" opacity="0.4"/>
  `);
}

// ── Royal Guard (unique Chess 2 piece) ─────────────────────────────────────
// Visual concept: Shield-bearing armored protector
function royalGuardSVG(owner: Player): string {
  const c = colors(owner);
  const shieldColor = owner === Player.White ? '#c0d8f0' : '#4060a0';
  const shieldHighlight = owner === Player.White ? '#e8f4ff' : '#6080c0';
  return svgWrap(`
    ${shadow(c)}
    ${rim(c, 38, 30)}
    <rect x="5" y="32" width="30" height="7" rx="2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.9"/>
    <path d="M11 32 C10 26 11 20 15 16 L15 13 C15 11 17 10 20 10 C23 10 25 11 25 13 L25 16 C29 20 30 26 29 32 Z"
      fill="${c.body}" stroke="${c.stroke}" stroke-width="0.8" stroke-linejoin="round"/>
    <path d="M15 13 L14 11 L20 9 L26 11 L25 13"
      fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7" stroke-linejoin="round"/>
    <ellipse cx="20" cy="9" rx="4" ry="2.5" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="0.7"/>
    <ellipse cx="20" cy="7.5" rx="3.5" ry="2" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.6"/>
    <path d="M5 15 C5 12 7 10 9.5 10 L9.5 30 C7 30 5 28 5 25 Z"
      fill="${shieldColor}" stroke="${c.stroke}" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M5.5 14.5 C5.5 12 7 10.5 9.5 10.5 L9.5 29 C7 29 5.5 27 5.5 24 Z"
      fill="${shieldHighlight}" opacity="0.45"/>
    <path d="M7 17 L7 22 M7 19.5 L9 19.5" stroke="${c.stroke}" stroke-width="0.8" opacity="0.6" stroke-linecap="round"/>
    <rect x="12" y="28" width="16" height="5" rx="1" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.5"/>
    <circle cx="18" cy="19" r="2.5" fill="${c.highlight}" opacity="0.35"/>
  `);
}

// ── Diplomat (neutral piece) ────────────────────────────────────────────────
// Visual concept: Circular diplomatic seal / medallion — no ownership coloring
function diplomatSVG(): string {
  const ring   = '#8090a8';
  const inner  = '#c8d8e8';
  const accent = '#6878a0';
  const text   = '#3a4868';
  return svgWrap(`
    <ellipse cx="20" cy="45" rx="12" ry="2" fill="rgba(50,60,80,0.3)"/>
    <rect x="9" y="37" width="22" height="5" rx="2" fill="#7080a0" stroke="#3a4868" stroke-width="0.6"/>
    <circle cx="20" cy="24" r="14" fill="${inner}" stroke="${ring}" stroke-width="1.5"/>
    <circle cx="20" cy="24" r="11" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="3 2"/>
    <circle cx="20" cy="24" r="8" fill="#dce8f0" stroke="${accent}" stroke-width="0.8"/>
    <path d="M16 22 C16 19 18 17 20 17 C22 17 24 19 24 22 L24 26 L20 28 L16 26 Z"
      fill="${accent}" stroke="${text}" stroke-width="0.5"/>
    <path d="M18 22 L20 21 L22 22 L22 26 L20 27 L18 26 Z" fill="${inner}" opacity="0.7"/>
    <circle cx="20" cy="12" r="2" fill="${accent}" stroke="${text}" stroke-width="0.5"/>
    <path d="M17 37 L17 29" stroke="${ring}" stroke-width="0.8" opacity="0.4"/>
    <path d="M23 37 L23 29" stroke="${ring}" stroke-width="0.8" opacity="0.4"/>
  `);
}

// ── Promotion modal symbols ──────────────────────────────────────────────────
export function getPromoSVG(type: PieceType, owner: Player): string {
  switch (type) {
    case PieceType.Queen:  return queenSVG(owner);
    case PieceType.Rook:   return rookSVG(owner);
    case PieceType.Bishop: return bishopSVG(owner);
    case PieceType.Knight: return knightSVG(owner);
    default: return '';
  }
}

// ── Main renderer function ───────────────────────────────────────────────────
/**
 * Returns an HTML string containing the SVG piece for the given type and owner.
 * The piece is wrapped in a <span class="piece"> container with appropriate classes.
 * Aria-label is set on the parent square by BoardRenderer.
 */
export function renderPieceSVG(type: PieceType, owner: Player | null): string {
  let svg = '';
  switch (type) {
    case PieceType.Pawn:       svg = pawnSVG(owner!); break;
    case PieceType.Rook:       svg = rookSVG(owner!); break;
    case PieceType.Bishop:     svg = bishopSVG(owner!); break;
    case PieceType.Knight:     svg = knightSVG(owner!); break;
    case PieceType.Queen:      svg = queenSVG(owner!); break;
    case PieceType.King:       svg = kingSVG(owner!); break;
    case PieceType.Minister:   svg = ministerSVG(owner!); break;
    case PieceType.RoyalGuard: svg = royalGuardSVG(owner!); break;
    case PieceType.Diplomat:   svg = diplomatSVG(); break;
    default: svg = '';
  }
  return svg;
}

/**
 * Creates and returns a DOM element for a piece.
 * Used by BoardRenderer for insertion into the square.
 */
export function createPieceElement(type: PieceType, owner: Player | null): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'piece piece-svg';

  if (type === PieceType.Diplomat) {
    wrapper.classList.add('diplomat-piece');
  } else {
    const ownerClass = owner === Player.White ? 'white-piece' : 'black-piece';
    wrapper.classList.add(ownerClass);
    // Add type class for CSS targeting
    wrapper.classList.add(`piece-${type.toLowerCase()}`);
  }

  wrapper.innerHTML = renderPieceSVG(type, owner);
  return wrapper;
}

/**
 * Creates a flying piece element for the AnimationManager move animation.
 * Returns the element ready to be positioned and appended to document.body.
 */
export function createFlyingPieceElement(type: PieceType, owner: Player): HTMLElement {
  const el = document.createElement('span');
  el.className = 'piece piece-svg flying-piece';
  const ownerClass = owner === Player.White ? 'white-piece' : 'black-piece';
  el.classList.add(ownerClass);
  el.innerHTML = renderPieceSVG(type, owner);
  return el;
}
