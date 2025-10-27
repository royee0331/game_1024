import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameState, Tile } from '@core/types';
import { useSessionStore } from '../state/sessionStore';
import type { ViewportLayoutProfile } from '../hooks/useMobileViewport';
import '../styles/tile-grid.css';

interface TileGridProps {
  board: GameState['board'];
  layout?: ViewportLayoutProfile;
}

function positionFor(tile: Tile, size: number, gap: number) {
  return {
    x: tile.col * (size + gap),
    y: tile.row * (size + gap)
  };
}

const tileVariants = {
  initial: ({ isNew }: { isNew: boolean }) => ({
    scale: isNew ? 0.3 : 1,
    opacity: isNew ? 0 : 1
  }),
  animate: ({ x, y }: { x: number; y: number }) => ({
    x,
    y,
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
      mass: 0.8
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.12 }
  }
};

const getTileTone = (value: number): string => {
  if (value <= 4) return 'tile--primary';
  if (value <= 16) return 'tile--secondary';
  if (value <= 64) return 'tile--tertiary';
  if (value <= 256) return 'tile--quaternary';
  return 'tile--accent';
};

export const TileGrid: React.FC<TileGridProps> = ({ board, layout }) => {
  const completeAnimation = useSessionStore((state) => state.completeAnimation);
  const isAnimating = useSessionStore((state) => state.isAnimating);
  const tileSize = layout?.tileSize ?? 86;
  const tileGap = layout?.gridGap ?? 12;
  const containerPadding = tileGap;
  const containerSize = tileSize * 4 + tileGap * 3 + containerPadding * 2;

  useEffect(() => {
    if (!isAnimating) {
      return;
    }
    const timeout = window.setTimeout(() => {
      completeAnimation();
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [board, completeAnimation, isAnimating]);

  const tiles = board.flatMap((row) => row.filter((cell): cell is Tile => Boolean(cell)));

  return (
    <div
      className="tile-grid"
      style={{
        width: containerSize,
        height: containerSize,
        '--tile-size': `${tileSize}px`,
        '--tile-gap': `${tileGap}px`
      } as React.CSSProperties}
    >
      <div className="tile-grid__background">
        {board.map((row, rowIndex) => (
          <div className="tile-grid__row" key={`row-${rowIndex}`}>
            {row.map((_, colIndex) => (
              <div className="tile-grid__cell" key={`cell-${rowIndex}-${colIndex}`} />
            ))}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {tiles.map((tile) => {
          const position = positionFor(tile, tileSize, tileGap);
          return (
            <motion.div
              key={tile.id}
              className={`tile ${getTileTone(tile.value)}`}
              data-test={`tile-position-${tile.row}-${tile.col}`}
              data-test-new={tile.isNew ? 'true' : 'false'}
              data-test-value={tile.value}
              custom={{ ...position, isNew: tile.isNew }}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={tileVariants}
            >
              <span data-test={`tile-value-${tile.value}`}>{tile.value}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
