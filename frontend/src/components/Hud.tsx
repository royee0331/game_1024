import React, { useId } from 'react';
import { formatScore } from '@shared/formatters/boardHash';

export type HudLayoutVariant = 'wide' | 'stacked';

interface HudProps {
  score: number;
  bestScore: number;
  moveCount: number;
  variant: HudLayoutVariant;
}

const HUD_LABELS: Record<'score' | 'bestScore' | 'moveCount', string> = {
  score: '当前得分',
  bestScore: '最佳成绩',
  moveCount: '步数'
};

type HudMetricKey = 'score' | 'bestScore' | 'moveCount';

interface HudMetricConfig {
  key: HudMetricKey;
  label: string;
  value: string;
  testId: string;
}

export const Hud: React.FC<HudProps> = ({ score, bestScore, moveCount, variant }) => {
  const baseId = useId();
  const metrics: HudMetricConfig[] = [
    {
      key: 'score',
      label: HUD_LABELS.score,
      value: formatScore(score),
      testId: 'score-value'
    },
    {
      key: 'bestScore',
      label: HUD_LABELS.bestScore,
      value: formatScore(bestScore),
      testId: 'best-score-value'
    },
    {
      key: 'moveCount',
      label: HUD_LABELS.moveCount,
      value: formatScore(moveCount),
      testId: 'move-count-value'
    }
  ];

  return (
    <section className={`hud hud--${variant}`} role="status" aria-live="polite" data-layout={variant}>
      <dl className="hud__list">
        {metrics.map((metric) => {
          const labelId = `${baseId}-${metric.key}-label`;
          const valueId = `${baseId}-${metric.key}-value`;
          return (
            <div
              key={metric.key}
              className="hud__metric"
              role="group"
              aria-labelledby={labelId}
              aria-describedby={valueId}
            >
              <dt id={labelId} className="hud__label">
                {metric.label}
              </dt>
              <dd id={valueId} className="hud__value" data-test={metric.testId}>
                {metric.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
};
