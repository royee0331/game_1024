import React, { useEffect, useRef, useState } from 'react';
import { formatScore } from '@shared/formatters/boardHash';
import { useSessionStore } from '../state/sessionStore';

const START_MESSAGE = '使用方向键或滑动来合并数字';
const GAME_OVER_ACTIVE_MESSAGE = '挑战完成提示已打开，请使用弹窗按钮继续。';
const GAME_OVER_ACK_MESSAGE = '挑战完成，可随时重新开始。';
const NO_MOVE_MESSAGE = '滑动距离太短，请继续尝试';

export interface GameAnnouncementsProps {
  suppressGameOverMessage?: boolean;
}

export const GameAnnouncements: React.FC<GameAnnouncementsProps> = ({ suppressGameOverMessage = false }) => {
  const status = useSessionStore((state) => state.game.status);
  const score = useSessionStore((state) => state.game.score);
  const moveCount = useSessionStore((state) => state.game.moveCount);
  const lastGesture = useSessionStore((state) => state.lastGesture);
  const noMovePromptAt = useSessionStore((state) => state.noMovePromptAt);
  const clearNoMovePrompt = useSessionStore((state) => state.setNoMovePrompt);
  const resumeAt = useSessionStore((state) => state.resumeAt);
  const lastVisibleAt = useSessionStore((state) => state.lastVisibleAt);
  const clearResume = useSessionStore((state) => state.setResumeAt);
  const gameOverAcknowledged = useSessionStore((state) => state.gameOverAcknowledged);
  const [message, setMessage] = useState<string>(START_MESSAGE);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (status === 'gameOver') {
      if (suppressGameOverMessage) {
        setMessage(GAME_OVER_ACTIVE_MESSAGE);
        return;
      }
      setMessage(gameOverAcknowledged ? GAME_OVER_ACK_MESSAGE : GAME_OVER_ACTIVE_MESSAGE);
      return;
    }

    if (resumeAt && lastVisibleAt) {
      const pausedMs = Math.max(0, resumeAt - lastVisibleAt);
      const pausedSeconds = Math.max(1, Math.round(pausedMs / 1000));
      setMessage(`已从后台返回，暂停 ${pausedSeconds} 秒`);
      timeoutRef.current = window.setTimeout(() => {
        clearResume(null);
        setMessage(moveCount > 0 ? `已完成 ${moveCount} 步，当前得分 ${formatScore(score)} 分` : START_MESSAGE);
      }, 4_500);
      return;
    }

    if (noMovePromptAt) {
      setMessage(NO_MOVE_MESSAGE);
      timeoutRef.current = window.setTimeout(() => {
        clearNoMovePrompt(null);
        setMessage(moveCount > 0 ? `已完成 ${moveCount} 步，当前得分 ${formatScore(score)} 分` : START_MESSAGE);
      }, 2_500);
      return;
    }

    if (lastGesture) {
      const verb = lastGesture.type === 'tap' ? '点击移动' : '滑动';
      const latency = Math.max(0, Math.round(lastGesture.latencyMs));
      setMessage(`${verb}完成，用时 ${latency} 毫秒`);
      timeoutRef.current = window.setTimeout(() => {
        setMessage(moveCount > 0 ? `已完成 ${moveCount} 步，当前得分 ${formatScore(score)} 分` : START_MESSAGE);
      }, 4_000);
      return;
    }

    if (moveCount > 0) {
      setMessage(`已完成 ${moveCount} 步，当前得分 ${formatScore(score)} 分`);
      return;
    }

    setMessage(START_MESSAGE);
  }, [
    status,
    moveCount,
    score,
    lastGesture,
    noMovePromptAt,
    clearNoMovePrompt,
    resumeAt,
    lastVisibleAt,
    clearResume,
    suppressGameOverMessage,
    gameOverAcknowledged
  ]);

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
