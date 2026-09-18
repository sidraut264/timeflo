/**
 * @jest-environment jsdom
 */
import { GameState } from '../src/game/GameState';
import { Player } from '../src/game/Player';
import { BoardRenderer, BoardOrientation } from '../src/ui/BoardRenderer';
import { AnimationManager } from '../src/ui/AnimationManager';
import { ShieldSystem, RelativeDirection } from '../src/game/ShieldSystem';

describe('Board Orientation / Player Perspective', () => {
  let gameState: GameState;
  let container: HTMLElement;
  let renderer: BoardRenderer;

  beforeEach(() => {
    // Setup minimal DOM for BoardRenderer
    document.body.innerHTML = `
      <div class="file-labels top"></div>
      <div class="rank-labels"></div>
      <div id="board-container"></div>
      <div class="rank-labels"></div>
      <div class="file-labels bottom"></div>
    `;
    container = document.getElementById('board-container')!;
    gameState = new GameState(); // default new game
    renderer = new BoardRenderer('board-container', gameState);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('defaults to White orientation and correctly orders DOM squares', () => {
    renderer.render();
    expect(renderer.orientation).toBe(BoardOrientation.White);

    const squares = Array.from(container.querySelectorAll('.square')) as HTMLElement[];
    expect(squares.length).toBe(81);

    // In White orientation, top-left square visually is a9 (file 0, rank 8)
    const firstSquare = squares[0];
    expect(firstSquare.dataset.file).toBe('0');
    expect(firstSquare.dataset.rank).toBe('8');

    // Bottom-right square visually is i1 (file 8, rank 0)
    const lastSquare = squares[80];
    expect(lastSquare.dataset.file).toBe('8');
    expect(lastSquare.dataset.rank).toBe('0');
  });

  it('rotates DOM squares when set to Black orientation', () => {
    renderer.setOrientation(BoardOrientation.Black);
    
    const squares = Array.from(container.querySelectorAll('.square')) as HTMLElement[];
    expect(squares.length).toBe(81);

    // In Black orientation, top-left square visually is i1 (file 8, rank 0)
    const firstSquare = squares[0];
    expect(firstSquare.dataset.file).toBe('8');
    expect(firstSquare.dataset.rank).toBe('0');

    // Bottom-right square visually is a9 (file 0, rank 8)
    const lastSquare = squares[80];
    expect(lastSquare.dataset.file).toBe('0');
    expect(lastSquare.dataset.rank).toBe('8');
  });

  it('dynamically updates coordinate labels for White orientation', () => {
    renderer.setOrientation(BoardOrientation.White);
    renderer.render();

    const fileLabels = document.querySelector('.file-labels.top');
    expect(fileLabels?.textContent).toContain('a');
    expect(fileLabels?.textContent).toContain('i');
    
    // First letter should be 'a' (after spacer)
    const spans = fileLabels?.querySelectorAll('span');
    expect(spans?.[0].textContent).toBe('a');
    expect(spans?.[8].textContent).toBe('i');

    const rankLabels = document.querySelector('.rank-labels');
    const rankSpans = rankLabels?.querySelectorAll('span');
    expect(rankSpans?.[0].textContent).toBe('9');
    expect(rankSpans?.[8].textContent).toBe('1');
  });

  it('dynamically updates coordinate labels for Black orientation', () => {
    renderer.setOrientation(BoardOrientation.Black);
    renderer.render();

    const fileLabels = document.querySelector('.file-labels.top');
    const spans = fileLabels?.querySelectorAll('span');
    expect(spans?.[0].textContent).toBe('i'); // file 8
    expect(spans?.[8].textContent).toBe('a'); // file 0

    const rankLabels = document.querySelector('.rank-labels');
    const rankSpans = rankLabels?.querySelectorAll('span');
    expect(rankSpans?.[0].textContent).toBe('1'); // rank 0
    expect(rankSpans?.[8].textContent).toBe('9'); // rank 8
  });

  it('flips the Shield directional CSS class based on orientation', () => {
    // We can test this by checking the generated shield arcs in the DOM
    renderer.setOrientation(BoardOrientation.White);
    renderer.render();

    // The White Royal Guard is at e2 (file 4, rank 1). It protects its OWN front.
    const e2Square = container.querySelector('.square[data-file="4"][data-rank="1"]');
    expect(e2Square).not.toBeNull();
    
    // White shield protecting front should map to 'sd-top' in White orientation
    const arcWhite = e2Square!.querySelector('.shield-overlay.shield-white');
    expect(arcWhite?.classList.contains('sd-top')).toBe(true);

    // Switch to Black orientation
    renderer.setOrientation(BoardOrientation.Black);
    // In Black orientation, "Front" for White (which is high rank) visually points towards the bottom of the screen
    const e2SquareBlack = container.querySelector('.square[data-file="4"][data-rank="1"]');
    const arcBlack = e2SquareBlack!.querySelector('.shield-overlay.shield-white');
    expect(arcBlack?.classList.contains('sd-bottom')).toBe(true);
  });
});
