import React from 'react';
import { formatScore } from '@shared/formatters/boardHash';

interface HudProps {
  score: number;
  bestScore: number;
  moveCount: number;
}

export const Hud: React.FC<HudProps> = ({ score, bestScore, moveCount }) => {
  return (
    <div className="hud" role="status" aria-live="polite">
      <div className="hud__metric" data-test="score-value">
        <span className="hud__label">Score</span>
        <span className="hud__value">{formatScore(score)}</span>
      </div>
      <div className="hud__metric" data-test="best-score-value">
        <span className="hud__label">Best</span>
        <span className="hud__value">{formatScore(bestScore)}</span>
      </div>
      <div className="hud__metric" data-test="move-count-value">
        <span className="hud__label">Moves</span>
        <span className="hud__value">{formatScore(moveCount)}</span>
      </div>
    </div>
  );
};
