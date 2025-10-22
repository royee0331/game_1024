import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { GameOverModal } from '../src/components/GameOverModal';
import { useSessionStore } from '../src/state/sessionStore';
import { resolveFixture } from '../src/fixtures';
import '../src/styles/global.css';
import '../src/styles/mobile.css';

const fixture = resolveFixture('fixture-mobile-gameover-001');

const GameOverPreview: React.FC = () => {
  const hydrate = useSessionStore((state) => state.hydrate);
  useEffect(() => {
    const original = useSessionStore.getState().game;
    const hydrated = fixture
      ? { ...fixture, status: 'gameOver' as const }
      : {
          ...original,
          status: 'gameOver' as const,
          score: 4096,
          bestScore: 4096,
          moveCount: 76
        };
    hydrate(hydrated);
    useSessionStore.getState().setGameOverAcknowledged(false);
    return () => {
      hydrate(original);
      useSessionStore.getState().setGameOverAcknowledged(true);
    };
  }, [hydrate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f16', padding: '2rem' }}>
      <GameOverModal />
    </div>
  );
};

const meta: Meta<typeof GameOverModal> = {
  title: 'Modals/GameOverModal',
  component: GameOverModal,
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <GameOverPreview />
};

export default meta;

type Story = StoryObj<typeof GameOverModal>;

export const Default: Story = {};
