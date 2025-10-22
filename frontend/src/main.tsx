import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameScene } from './scenes/GameScene';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GameScene />
  </React.StrictMode>,
);
