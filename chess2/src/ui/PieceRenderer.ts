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

function svgWrap64(content: string, extra = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false" ${extra}>${content}</svg>`;
}

function shadow(c: OwnerColors): string {
  return `<ellipse cx="20" cy="45" rx="13" ry="2.5" fill="${c.shadow}"/>`;
}

function shadow64(c: OwnerColors): string {
  return `<ellipse cx="32" cy="58" rx="20" ry="3.5" fill="${c.shadow}"/>`;
}

function rim(c: OwnerColors, y = 40, w = 26): string {
  const x = (40 - w) / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="${c.rim}" stroke="${c.stroke}" stroke-width="0.6"/>`;
}

// ── King ──────────────────────────────────────────────────────────────────────
function kingSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 49.318167,51.93182 c 0.04904,-2.65822 -0.520684,-5.990621 -0.681817,-9.431816 8.71968,-7.45013 9.34291,-17.3979 3.40909,-20.45455 -4.9725,-2.75631 -9.68663,-1.56165 -15.90909,3.86364 0.76915,-3.40699 0.89008,-10.71968 -4.77272,-10.71968 -5.6628,0 -5.54187,7.31269 -4.77272,10.71968 -6.22246,-5.42529 -10.93659,-6.61995 -15.90909,-3.86364 -5.93382,3.05665 -5.31059,13.00442 3.40909,20.45455 -0.274765,3.782106 -0.27632,5.523596 -0.90909,9.431816 13.93365,7.01696 24.018547,5.99661 36.136347,0 z" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="M 31.59091,14.886364 V 3.4090937" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 27.27273,7.6136337 h 8.52273" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 31.13636,39.772724 v -7.5" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 31.25,32.272724 c -1.47727,-3.41721 -2.95455,-4.79259 -4.43182,-6.13636" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 31.13636,32.272724 c 0.90803,-2.59155 2.35029,-4.56711 4.77274,-6.25" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 13.522731,50.795451 c 12.53788,-1.94552 23.257568,-1.459727 35.795448,0.227273" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 14.204542,47.499998 c 11.9794,-2.57941 22.755193,-2.26482 34.431823,0" />
  <path
     style="fill:none;fill-opacity:0.177083;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 14.43182,42.613634 c 11.40328,-3.37227 22.64974,-3.29421 33.75,0" />
  `);
}

// ── Queen ──────────────────────────────────────────────────────────────────────
function queenSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 341.99816,297.42687 7.8746,-20.40968 1.44635,22.82027 9.96378,-16.87414 c -1.48911,10.77291 -1.23949,22.72366 -8.99954,29.24851 l 3.21412,5.14259 c -12.64221,4.92832 -24.85587,4.92832 -36.64098,0 l 3.21412,-5.14259 c -4.97276,-4.22535 -7.19991,-16.13841 -8.99954,-29.24851 l 9.96378,16.87414 1.44635,-22.82027 7.8746,20.40968 5.14259,-22.09709 z"
     transform="translate(-306,-264)" />
  <ellipse
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     cx="312.38806"
     cy="278.94568"
     rx="3.4802911"
     ry="3.5355339"
     transform="translate(-306,-264)" />
  <ellipse
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     cx="323.79819"
     cy="273.72272"
     rx="3.4802911"
     ry="3.5355339"
     transform="translate(-306,-264)" />
  <ellipse
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     cx="337.29749"
     cy="271.95496"
     rx="3.4802911"
     ry="3.5355339"
     transform="translate(-306,-264)" />
  <ellipse
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     cx="350.63608"
     cy="273.88342"
     rx="3.4802911"
     ry="3.5355339"
     transform="translate(-306,-264)" />
  <ellipse
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     cx="362.93008"
     cy="279.18674"
     rx="3.4802911"
     ry="3.5355339"
     transform="translate(-306,-264)" />
  <path
     style="fill:none;fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 319.57966,316.7116 c 11.92061,-1.67848 23.59463,-1.95964 34.87322,0"
     transform="translate(-306,-264)" />
  <path
     style="fill:none;fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 321.9099,312.21183 c 9.96965,-2.2279 20.02896,-2.48327 30.21275,0"
     transform="translate(-306,-264)" />
  <path
     style="fill:none;fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 318.93684,306.90852 c 12.78573,-4.05284 25.11403,-3.87451 37.04275,0"
     transform="translate(-306,-264)" />
  <path
     style="fill:none;fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 317.32978,302.3284 c 13.30744,-5.13853 26.84234,-4.93151 40.57829,0"
     transform="translate(-306,-264)" />
  `);
}

// ── Rook ──────────────────────────────────────────────────────────────────────
function rookSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 51.26524,56.247132 v -4.33906 h -3.53553 v -5.30331 l -2.93135,-5.07723 h -2.05054 v -19.02868 l 6.34789,-4.302435 V 8.8388317 H 43.22993 V 13.338602 H 35.35534 V 8.9995417 H 28.60568 V 13.338602 H 20.73109 V 8.8388317 h -5.86578 v 9.4013093 l 6.34789,4.258711 v 19.02868 h -2.05054 l -2.93135,5.07723 v 5.30331 h -3.53553 v 4.33906 z" />
  <path
     style="fill:none;fill-opacity:0.132812;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="m 15.26708,17.838371 33.42687,-0.04372" />
  <path
     style="fill:none;fill-opacity:0.132812;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="M 20.89179,22.177442 H 42.42641" />
  <path
     style="fill:none;fill-opacity:0.132812;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="M 16.23131,52.174332 H 47.08688" />
  <path
     style="fill:none;fill-opacity:0.132812;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="M 17.03485,46.122652 H 47.08688" />
  <path
     style="fill:none;fill-opacity:0.132812;stroke:${c.stroke};stroke-width:1.52109;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="m 21.17762,41.736512 h 21.1529" />
  `);
}

// ── Bishop ──────────────────────────────────────────────────────────────────────
function bishopSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <defs />
  <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 37.246,55.652011 c 6.853371,-0.373136 16.019174,-2.033071 16.752692,0.999329 l 3.248869,-4.443447 C 54.39337,49.333146 47.52297,50.039791 40.650705,50.748076 c -2.830821,-1.396631 -3.245164,-2.782147 -4.131751,-4.169848 3.381145,-0.771875 3.052171,-0.614103 6.315065,-2.584534 L 40.410284,36.142003 C 53.015751,25.644788 43.138351,19.204418 34.215191,12.59186 37.235586,8.4296839 35.222324,5.1720866 31.978577,5.0533774 28.734829,4.9346683 26.70613,8.4055183 29.707382,12.581517 c -8.953417,6.57153 -18.860279,12.96649 -6.303131,23.521454 l -2.459752,7.84048 c 3.253821,1.985393 2.925572,1.826114 6.303131,2.613497 -0.89294,1.383616 -1.313636,2.76722 -4.150846,4.150835 -6.86894,-0.739824 -13.7360269,-1.477997 -16.6033763,1.383616 l 3.2284325,4.458314 C 10.469276,53.520722 19.62736,55.222706 26.47895,55.627299 c 2.701485,-0.309447 4.096715,-2.44765 5.383526,-4.737644 1.493846,3.391423 3.314159,4.824041 5.383524,4.762356 z" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="M 26.326195,25.206514 H 36.707804" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="M 31.669669,30.397324 V 19.86304" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 21.898739,41.542296 c 6.310394,-1.088728 12.620778,-1.348183 18.931172,0" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 23.57812,36.046147 c 4.928999,-1.032517 10.191287,-1.398457 16.335773,0" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 26.962843,46.559592 c 3.156319,0.771433 6.48794,0.666357 9.931818,0" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="M 31.874774,50.715842 V 47.531183" />
  <path
     style="fill:none;fill-opacity:0.0586667;stroke:${c.stroke};stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 29.608613,12.763848 c 1.949818,0.379201 3.177947,0.181051 4.427453,0" />
  `);
}

// ── Knight ──────────────────────────────────────────────────────────────────────
function knightSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <defs />
  <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="M 12.158777,43.932377 C 2.3756165,40.330819 9.8161318,30.111637 13.129738,24.18959 c 0.02835,-4.431024 2.79137,-7.704756 5.178473,-11.166 -0.621449,-1.554143 -0.780189,-4.1657964 -0.647339,-7.4440164 2.267055,1.4811963 4.364456,3.21685 5.987575,5.6639054 l 2.751071,-0.161575 c 0.209764,-1.5539529 0.874819,-3.3032129 2.589213,-5.5020941 2.611275,1.4488812 4.06148,5.2707401 4.217291,5.9090071 11.825622,-2.5379046 26.624504,10.825372 25.396914,44.257088 l -14.564363,0.323622 -22.533119,-0.0189 c -1.51233,-12.925701 16.13041,-15.265607 11.52893,-24.416977 -6.112393,5.639009 -9.443008,4.028362 -11.48967,7.282205 -1.320331,2.131937 -2.726976,4.177654 -4.369322,5.987575 -0.863055,-0.269764 -2.136473,-1.203071 -1.703245,-4.745433 -0.776409,3.250204 -2.347416,3.986598 -3.31337,3.774425 z" />
  <path
     style="fill:#000000;fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 32.636636,32.001637 c 1.468771,-1.530756 1.752142,-5.184331 2.190897,-8.33367 0.07323,2.953229 -0.256535,5.924883 -1.515354,8.582127 z" />
  <path
     style="fill:#000000;fill-opacity:1;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
     d="m 17.720494,23.210267 c 0.632598,-1.914803 0.941102,-2.425228 1.258677,-2.97515 0.381732,-0.613937 1.046315,-0.963637 1.830851,-1.201512 0.07559,1.121245 -0.04253,1.952551 -0.82063,2.924882 -0.650079,0.592678 -1.18252,0.884127 -2.268898,1.25178 z" />
  <path
     style="fill:#000000;fill-opacity:1;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none"
     d="m 10.378714,37.1357 c 0.14315,-0.615496 0.311339,-1.211339 0.930473,-1.456441 0.600897,0.242835 0.625984,0.747685 0.647339,1.254142 -0.198425,0.395905 -0.452127,0.718771 -0.970962,0.687733 -0.365668,0.02363 -0.617575,-0.08031 -0.60685,-0.485434 z" />
  <path
     style="fill:none;stroke:${c.stroke};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="M 33.390263,11.774066 C 51.629885,11.091466 57.422006,30.013979 57,54.909091" />
  `);
}

// ── Pawn ──────────────────────────────────────────────────────────────────────
function pawnSVG(owner: Player): string {
  const c = colors(owner);
  return svgWrap64(`
    ${shadow64(c)}
    <defs />
  <path
     style="fill:${c.body};fill-opacity:1;stroke:${c.stroke};stroke-width:2;stroke-linecap:round;stroke-dasharray:none"
     d="M 51.268706,56.362118 C 50.802757,44.765705 48.695621,39.872548 37.883883,35.125773 46.401395,29.942923 45.271771,21.833686 35.293421,18.296036 v 0 c 4.785862,-3.668413 1.902687,-9.9524133 -3.3974,-9.9521508 -5.300075,2.625e-4 -8.182788,6.2843378 -3.396663,9.9524008 v 0 C 18.521271,21.834673 17.392246,29.943998 25.910146,35.126211 15.098758,39.873786 13.219119,44.767093 12.754032,56.363543 Z" />
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
