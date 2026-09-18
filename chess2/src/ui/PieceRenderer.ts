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


// ── Shared furniture for the custom pieces ───────────────────────────────────
// Every stock piece stands on the same flared, ridged plinth. The custom pieces
// reuse that exact footprint so they read as members of the same set rather
// than imports from a different one. Only the silhouette above the collar is
// allowed to be new — that is where meaning lives.

const PLINTH_PATH =
  'M 12.5 56 C 13 47.6 16.6 43.6 21.6 41.5 L 42.4 41.5 C 47.4 43.6 51 47.6 51.5 56 Z';

function plinth(body: string, stroke: string): string {
  return `
    <path d="${PLINTH_PATH}" fill="${body}" stroke="${stroke}" stroke-width="2"
          stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M 14.4 51.4 H 49.6 M 16.8 46.6 H 47.2" fill="none" stroke="${stroke}"
          stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.85"/>`;
}

// Draws an arc of olive stem with leaves splayed outward along it.
// Angles are in degrees, 0 = east, increasing clockwise (SVG y grows downward).
function oliveArc(
  cx: number, cy: number, r: number,
  fromDeg: number, toDeg: number, leafCount: number,
  stem: string, leafFill: string, stroke: string,
): string {
  const pt = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  };
  const sweep = toDeg > fromDeg ? 1 : 0;
  let out = `<path d="M ${pt(fromDeg, r)} A ${r} ${r} 0 0 ${sweep} ${pt(toDeg, r)}"
    fill="none" stroke="${stem}" stroke-width="1.7" stroke-linecap="round"/>`;
  for (let i = 0; i < leafCount; i++) {
    const t = fromDeg + ((toDeg - fromDeg) * (i + 0.5)) / leafCount;
    const a = (t * Math.PI) / 180;
    const lx = cx + (r + 2.7) * Math.cos(a);
    const ly = cy + (r + 2.7) * Math.sin(a);
    out += `<ellipse cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" rx="1.5" ry="3.1"
      fill="${leafFill}" stroke="${stroke}" stroke-width="0.8"
      transform="rotate(${(t - 90).toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})"/>`;
  }
  return out;
}

// ── Minister (unique Chess 2 piece) ──────────────────────────────────────────
// Concept: the voice of the crown. A robed official in a wrapped turban with a
// swept plume of office, holding an open decree across the chest. The plume
// breaks the silhouette to one side, which is what separates it from the
// Bishop's symmetrical mitre at a glance.
function ministerSVG(owner: Player): string {
  const c = colors(owner);
  const gold = owner === Player.White ? '#c9a227' : '#b9a3f0';
  return svgWrap64(`
    ${shadow64(c)}
    ${plinth(c.body, c.stroke)}

    <!-- robe -->
    <path d="M 22.6 41.5 C 21.6 34.2 23.4 27.6 27 23.6 L 37 23.6 C 40.6 27.6 42.4 34.2 41.4 41.5 Z"
          fill="${c.body}" stroke="${c.stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 27.4 26.8 C 26 32 25.4 37 25.6 41.2 M 36.6 26.8 C 38 32 38.6 37 38.4 41.2"
          fill="none" stroke="${c.stroke}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.45"/>

    <!-- sash of office -->
    <path d="M 27.6 24.8 C 31 30.2 35 34.6 39.6 37.6" fill="none" stroke="${gold}"
          stroke-width="2.6" stroke-linecap="round"/>

    <!-- decree, held open across the chest -->
    <rect x="22.4" y="30.4" width="19.2" height="5.6" rx="2.2"
          fill="${c.highlight}" stroke="${c.stroke}" stroke-width="1.5"/>
    <path d="M 26.6 32.4 H 37.4 M 26.6 34.2 H 34.4" fill="none" stroke="${c.stroke}"
          stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.55"/>
    <circle cx="22.6" cy="33.2" r="3.2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="1.5"/>
    <circle cx="41.4" cy="33.2" r="3.2" fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="1.5"/>
    <circle cx="22.6" cy="33.2" r="1.1" fill="${c.highlight}" stroke="none" opacity="0.8"/>
    <circle cx="41.4" cy="33.2" r="1.1" fill="${c.highlight}" stroke="none" opacity="0.8"/>

    <!-- head -->
    <circle cx="32" cy="18.6" r="6.1" fill="${c.body}" stroke="${c.stroke}" stroke-width="2"/>

    <!-- plume, swept back from the turban jewel -->
    <path d="M 34.4 11.6 C 40.6 9.4 45.6 5.4 47.6 1.2 C 49 8.2 43.2 14 36.4 16 Z"
          fill="${gold}" stroke="${c.stroke}" stroke-width="1.3" stroke-linejoin="round"/>

    <!-- wrapped turban -->
    <path d="M 25 19 C 23.2 8.4 40.8 8.4 39 19 C 34.6 16.2 29.4 16.2 25 19 Z"
          fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 26.6 15 C 30.2 13 33.8 13 37.4 15" fill="none" stroke="${c.stroke}"
          stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.5"/>
    <circle cx="32" cy="11.8" r="2.6" fill="${gold}" stroke="${c.stroke}" stroke-width="1.2"/>
  `);
}

// ── Royal Guard (unique Chess 2 piece) ───────────────────────────────────────
// Concept: a body between the king and the board. Closed great helm, plated
// cuirass, halberd planted behind the shoulder, and a tower shield braced in
// front that overlaps the plinth — the piece is literally standing behind cover.
function royalGuardSVG(owner: Player): string {
  const c = colors(owner);
  const steel      = owner === Player.White ? '#a8bacf' : '#5d6f96';
  const steelLight = owner === Player.White ? '#e8f0f8' : '#8fa1c6';
  const crest      = owner === Player.White ? '#b4442f' : '#7a4fd0';
  return svgWrap64(`
    ${shadow64(c)}

    <!-- halberd, planted behind the shoulder -->
    <path d="M 45.8 49.6 L 39.8 11" fill="none" stroke="${c.stroke}"
          stroke-width="2.8" stroke-linecap="round"/>
    <path d="M 39.2 4 L 42.8 11 L 39.4 15.8 L 35.9 11.2 Z" fill="${steel}"
          stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round"/>

    ${plinth(c.body, c.stroke)}

    <!-- pauldron -->
    <path d="M 38.2 26.8 C 43 27.8 45.2 30.6 45.4 34.6 C 43 33 40.8 32.2 38.8 32 Z"
          fill="${c.body}" stroke="${c.stroke}" stroke-width="1.8" stroke-linejoin="round"/>

    <!-- cuirass -->
    <path d="M 24.4 41.5 C 23.4 35 24 30 25.6 26.6 L 38.4 26.6 C 40 30 40.6 35 39.6 41.5 Z"
          fill="${c.bodyDark}" stroke="${c.stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 25.1 37.4 H 38.9 M 24.7 33.2 H 39.3" fill="none" stroke="${c.stroke}"
          stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.8"/>

    <!-- crest -->
    <path d="M 25.4 14.8 C 26 7.6 29 3.8 32 3.2 C 35 3.8 38 7.6 38.6 14.8 C 35 12.2 29 12.2 25.4 14.8 Z"
          fill="${crest}" stroke="${c.stroke}" stroke-width="1.6" stroke-linejoin="round"/>

    <!-- great helm -->
    <path d="M 25.6 26.8 L 38.4 26.8 L 39.4 17.4 C 39.4 11.2 24.6 11.2 24.6 17.4 Z"
          fill="${c.body}" stroke="${c.stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 26.4 20.8 H 37.6" fill="none" stroke="${c.stroke}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M 29 23.4 V 25.8 M 32 23.4 V 25.8 M 35 23.4 V 25.8" fill="none" stroke="${c.stroke}"
          stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.7"/>

    <!-- tower shield, braced in front -->
    <path d="M 7.4 23.6 C 7.4 21.4 8.8 20.2 10.8 20.2 L 22 20.2 C 24 20.2 25.4 21.4 25.4 23.6
             L 25.4 38.4 C 25.4 45.8 20.8 50.8 16.4 52.6 C 12 50.8 7.4 45.8 7.4 38.4 Z"
          fill="${steel}" stroke="${c.stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 9.8 23.8 C 9.8 22.8 10.6 22.4 11.4 22.4 L 16.4 22.4 L 16.4 49.8
             C 13 47.8 9.8 44 9.8 38.4 Z"
          fill="${steelLight}" stroke="none" opacity="0.5"/>
    <path d="M 16.4 24.6 V 46.4 M 10.6 30.8 H 22.2" fill="none" stroke="${c.stroke}"
          stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.75"/>
    <circle cx="10.6" cy="24.4" r="1.3" fill="${c.stroke}" opacity="0.5"/>
    <circle cx="22.2" cy="24.4" r="1.3" fill="${c.stroke}" opacity="0.5"/>
  `);
}

// ── Diplomat (neutral piece) ─────────────────────────────────────────────────
// Concept: belongs to neither player, so the figure is split down the middle —
// ivory on one side, charcoal on the other, seam dead centre. An olive wreath
// closes over the head. No owner colours are used anywhere.
function diplomatSVG(): string {
  const stroke = '#2f3442';
  const light  = '#efe8d9';
  const dark   = '#353a4c';
  const gold   = '#c9a227';
  const leaf   = '#7f9d5c';
  const stem   = '#5d7742';
  return svgWrap64(`
    <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(30,36,50,0.4)"/>
    <path d="${PLINTH_PATH}" fill="${light}" stroke="${stroke}" stroke-width="2"
          stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M 32 41.5 L 42.4 41.5 C 47.4 43.6 51 47.6 51.5 56 L 32 56 Z"
          fill="${dark}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 14.4 51.4 H 49.6 M 16.8 46.6 H 47.2" fill="none" stroke="${stroke}"
          stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/>

    <!-- robe, split down the seam: the piece answers to neither side -->
    <path d="M 32 23.6 L 27 23.6 C 23.4 27.6 21.6 34.2 22.6 41.5 L 32 41.5 Z"
          fill="${light}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M 32 23.6 L 37 23.6 C 40.6 27.6 42.4 34.2 41.4 41.5 L 32 41.5 Z"
          fill="${dark}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>

    <!-- treaty sash, knotted at the seam -->
    <path d="M 24.4 33.4 C 29 36.2 35 36.2 39.6 33.4" fill="none" stroke="${gold}"
          stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="32" cy="35.4" r="2.3" fill="${gold}" stroke="${stroke}" stroke-width="1.1"/>

    <!-- head, split the same way -->
    <path d="M 32 12.5 A 6.1 6.1 0 0 0 32 24.7 Z" fill="${light}" stroke="${stroke}"
          stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 32 12.5 A 6.1 6.1 0 0 1 32 24.7 Z" fill="${dark}" stroke="${stroke}"
          stroke-width="1.8" stroke-linejoin="round"/>

    <!-- olive wreath, closing over the head -->
    ${oliveArc(32, 19.6, 12.6, 118, 266, 5, stem, leaf, stroke)}
    ${oliveArc(32, 19.6, 12.6, 62, -86, 5, stem, leaf, stroke)}
    <circle cx="32" cy="6.8" r="2.4" fill="${gold}" stroke="${stroke}" stroke-width="1.2"/>
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
