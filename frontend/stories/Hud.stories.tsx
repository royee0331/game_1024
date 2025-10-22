import type { Meta, StoryObj } from '@storybook/react';
import { Hud, type HudLayoutVariant } from '../src/components/Hud';
import '../src/styles/global.css';

const meta: Meta<typeof Hud> = {
  title: 'HUD',
  component: Hud,
  args: {
    score: 2048,
    bestScore: 4096,
    moveCount: 76
  },
  parameters: {
    layout: 'centered'
  }
};

export default meta;

type Story = StoryObj<typeof Hud>;

const Template = (variant: HudLayoutVariant): Story => ({
  render: (args) => <Hud {...args} variant={variant} />
});

export const StackedMobile = Template('stacked');
export const WideDesktop = Template('wide');
