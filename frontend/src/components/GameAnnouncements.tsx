import React, { useEffect, useState } from 'react';
import { formatScore } from '@shared/formatters/boardHash';
import { useSessionStore } from '../state/sessionStore';

const START_MESSAGE = '使用方向键或滑动来合并数字';
const GAME_OVER_MESSAGE = '无可用移动，按回车重新开始';

export const GameAnnouncements: React.FC = () => {
  const status = useSessionStore((state) => state.game.status);
  const score = useSessionStore((state) => state.game.score);
  const moveCount = useSessionStore((state) => state.game.moveCount);
  const [message, setMessage] = useState<string>(START_MESSAGE);

  useEffect(() => {
    if (status === 'gameOver') {
      setMessage(GAME_OVER_MESSAGE);
      return;
    }

    if (moveCount > 0) {
      setMessage(`已完成 ${moveCount} 步，当前得分 ${formatScore(score)} 分`);
      return;
    }

    setMessage(START_MESSAGE);
  }, [status, moveCount, score]);

  return (
    <div
      className="game-announcements"
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      data-test="game-announcements"
    >
      {message}
    </div>
  );
};
