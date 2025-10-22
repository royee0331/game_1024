import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { MobileControls } from '../src/components/MobileControls';
import '../src/styles/mobile.css';

const meta: Meta<typeof MobileControls> = {
  title: 'Mobile/MobileControls',
  component: MobileControls,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark'
    }
  }
};

export default meta;
type Story = StoryObj<typeof MobileControls>;

const Preview: React.FC<{ orientation: 'portrait' | 'landscape' }> = ({ orientation }) => {
  const [visible, setVisible] = useState(true);
  return (
    <div style={{ minHeight: 320, minWidth: 320, position: 'relative' }}>
      <button
        type="button"
        style={{ marginBottom: 16 }}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? '隐藏控件' : '显示控件'}
      </button>
      <MobileControls orientation={orientation} visible={visible} />
    </div>
  );
};

export const Portrait: Story = {
  render: () => <Preview orientation="portrait" />
};

export const Landscape: Story = {
  render: () => <Preview orientation="landscape" />
};
