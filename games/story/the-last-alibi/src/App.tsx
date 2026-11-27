import React, { useEffect, useState } from 'react';
import { PhaserGameHost } from './game/PhaserGameHost';
import { gameStore } from './state/gameStore';
import { useGameState } from './state/useGameState';
import { GameHud } from './ui/components/GameHud';
import { InspectionModal, PuzzleModal } from './ui/components/InspectionAndPuzzleModals';
import { LandscapePrompt } from './ui/components/LandscapePrompt';
import { DeductionModal } from './ui/deduction/DeductionModal';
import { DialogueBox } from './ui/dialogue/DialogueBox';
import { EvidenceBoardModal } from './ui/evidence-board/EvidenceBoardModal';
import { InventoryModal } from './ui/inventory/InventoryModal';
import { JournalModal } from './ui/journal/JournalModal';
import { EndingScreen } from './ui/menus/EndingScreen';
import { MainMenu } from './ui/menus/MainMenu';
import { CreditsModal, SettingsModal } from './ui/menus/SettingsAndCredits';

export const App: React.FC = () => {
  const state = useGameState();
  const [menuSubModal, setMenuSubModal] = useState<'none' | 'settings' | 'credits'>('none');

  // Playtime ticker & keyboard shortcuts (I / J / E / Escape)
  useEffect(() => {
    const timer = window.setInterval(() => {
      gameStore.tickPlayTime(1);
    }, 1000);

    const onKeyDown = (e: KeyboardEvent) => {
      const current = gameStore.getState();
      if (current.screen !== 'playing') {
        if (e.key === 'Escape') setMenuSubModal('none');
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (current.activeDialogue) gameStore.closeDialogue();
        else if (current.activePuzzle) gameStore.closePuzzle();
        else if (current.activeInspection) gameStore.closeInspection();
        else if (current.openModal !== 'none') gameStore.setModal('none');
      } else if (e.key.toLowerCase() === 'i') {
        gameStore.setModal(current.openModal === 'inventory' ? 'none' : 'inventory');
      } else if (e.key.toLowerCase() === 'j') {
        gameStore.setModal(current.openModal === 'journal' ? 'none' : 'journal');
      } else if (e.key.toLowerCase() === 'e') {
        gameStore.setModal(current.openModal === 'evidence_board' ? 'none' : 'evidence_board');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (state.screen === 'menu') {
    return (
      <div className="game-shell">
        <MainMenu
          onOpenSettings={() => setMenuSubModal('settings')}
          onOpenCredits={() => setMenuSubModal('credits')}
        />
        {menuSubModal === 'settings' && <SettingsModal onClose={() => setMenuSubModal('none')} />}
        {menuSubModal === 'credits' && <CreditsModal onClose={() => setMenuSubModal('none')} />}
        <LandscapePrompt />
      </div>
    );
  }

  if (state.screen === 'ending') {
    return (
      <div className="game-shell">
        <EndingScreen />
        <LandscapePrompt />
      </div>
    );
  }

  return (
    <div className="game-shell">
      <PhaserGameHost />
      <GameHud />
      <DialogueBox />
      <InspectionModal />
      <PuzzleModal />
      <InventoryModal />
      <JournalModal />
      <EvidenceBoardModal />
      <DeductionModal />
      {state.openModal === 'settings' && (
        <SettingsModal onClose={() => gameStore.setModal('none')} />
      )}
      {state.openModal === 'credits' && (
        <CreditsModal onClose={() => gameStore.setModal('none')} />
      )}
      <LandscapePrompt />
    </div>
  );
};

export default App;
