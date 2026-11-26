import React, { useRef, useState } from 'react';
import { CLUES } from '../../data/clues/clues';
import { EVIDENCE_LINKS } from '../../data/evidence/links';
import { soundEngine } from '../../game/audio/SoundEngine';
import { gameStore } from '../../state/gameStore';
import { useGameState } from '../../state/useGameState';
import { ClueIllustration } from '../components/RetroArt';

export const EvidenceBoardModal: React.FC = () => {
  const state = useGameState();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'warn';
    title: string;
    message: string;
  } | null>(null);

  const [dragging, setDragging] = useState<{
    clueId: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  if (state.openModal !== 'evidence_board') return null;

  const getCardPos = (clueId: string, index: number) => {
    return (
      state.boardPositions[clueId] || {
        x: 36 + (index % 4) * 200,
        y: 34 + Math.floor(index / 4) * 134
      }
    );
  };

  const handleCardPointerDown = (e: React.PointerEvent, clueId: string, pos: { x: number; y: number }) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({
      clueId,
      offsetX: e.clientX - rect.left - pos.x,
      offsetY: e.clientY - rect.top - pos.y,
      moved: false
    });
  };

  const handleBoardPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const nx = Math.max(10, Math.min(rect.width - 175, e.clientX - rect.left - dragging.offsetX));
    const ny = Math.max(10, Math.min(rect.height - 105, e.clientY - rect.top - dragging.offsetY));
    if (!dragging.moved) {
      setDragging({ ...dragging, moved: true });
    }
    gameStore.updateBoardPosition(dragging.clueId, nx, ny);
  };

  const handleBoardPointerUp = () => {
    if (!dragging) return;
    const { clueId, moved } = dragging;
    setDragging(null);
    if (!moved) {
      handleCardClick(clueId);
    }
  };

  const handleCardClick = (clueId: string) => {
    soundEngine.playSfx('click');
    if (!selectedA) {
      setSelectedA(clueId);
      setFeedback({
        type: 'info',
        title: `Selected: ${CLUES[clueId]?.name}`,
        message: 'Now click a second exhibit to test whether they form a forensic link.'
      });
      return;
    }

    if (selectedA === clueId) {
      setSelectedA(null);
      setFeedback(null);
      return;
    }

    const res = gameStore.attemptEvidenceLink(selectedA, clueId);
    if (res.success) {
      soundEngine.playSfx('deduction');
      setFeedback({ type: 'success', title: res.title, message: res.message });
    } else {
      soundEngine.playSfx('error');
      setFeedback({ type: 'warn', title: res.title, message: res.message });
    }
    setSelectedA(null);
  };

  const solvedLinks = EVIDENCE_LINKS.filter((l) => state.discoveredLinks.includes(l.id));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Evidence Board">
      <div className="retro-panel modal-xl">
        <div className="panel-header">
          <h2>
            Investigation Evidence Board ({state.discoveredLinks.length} / {EVIDENCE_LINKS.length}{' '}
            Connections)
          </h2>
          <button className="close-x" onClick={() => gameStore.setModal('none')}>
            ✕
          </button>
        </div>

        <div className="board-layout">
          <div
            ref={boardRef}
            className="corkboard-surface"
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerLeave={handleBoardPointerUp}
          >
            {/* Red string connections */}
            <svg className="corkboard-strings" width="100%" height="100%">
              {solvedLinks.map((link) => {
                const idxA = state.inventory.indexOf(link.clueA);
                const idxB = state.inventory.indexOf(link.clueB);
                if (idxA === -1 || idxB === -1) return null;
                const posA = getCardPos(link.clueA, idxA);
                const posB = getCardPos(link.clueB, idxB);
                const x1 = posA.x + 82;
                const y1 = posA.y + 18;
                const x2 = posB.x + 82;
                const y2 = posB.y + 18;
                return (
                  <g key={link.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#9e2629"
                      strokeWidth="2.6"
                      strokeDasharray="6 3"
                    />
                    <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="4.5" fill="#d9a84e" />
                  </g>
                );
              })}
            </svg>

            {state.inventory.map((clueId, idx) => {
              const clue = CLUES[clueId];
              if (!clue) return null;
              const pos = getCardPos(clueId, idx);
              const isSelected = selectedA === clueId;
              const isLinked = solvedLinks.some(
                (l) => l.clueA === clueId || l.clueB === clueId
              );

              return (
                <div
                  key={clueId}
                  className={`board-pin-card ${isSelected ? 'selected' : ''} ${
                    isLinked ? 'linked' : ''
                  }`}
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                  onPointerDown={(e) => handleCardPointerDown(e, clueId, pos)}
                >
                  <div className="pin-tack" />
                  <div className="pin-card-inner">
                    <ClueIllustration clueId={clueId} size={42} />
                    <div className="pin-card-title">{clue.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="board-sidebar">
            <div className="board-instructions">
              <strong>How to Deduce:</strong> Drag cards to organize. Click any two exhibits to test
              whether they prove a contradiction or forensic link.
            </div>

            {feedback && (
              <div className={`board-feedback fb-${feedback.type}`}>
                <strong>{feedback.title}</strong>
                <p>{feedback.message}</p>
              </div>
            )}

            <h3>Confirmed Connections</h3>
            <div className="solved-links-list">
              {solvedLinks.length === 0 ? (
                <p className="muted-note">
                  No strings pinned yet. Try pairing items that share a substance, timestamp, or
                  hidden route.
                </p>
              ) : (
                solvedLinks.map((link) => (
                  <div key={link.id} className="solved-link-card">
                    <div className="solved-link-title">{link.title}</div>
                    <p>{link.deductionText}</p>
                  </div>
                ))
              )}
            </div>

            {state.flags.includes('murder_discovered') && (
              <button
                className="retro-btn primary"
                onClick={() => {
                  soundEngine.playSfx('click');
                  gameStore.setModal('deduction');
                }}
              >
                Proceed to Final Accusation
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
