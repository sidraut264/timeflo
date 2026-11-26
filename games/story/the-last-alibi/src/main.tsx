import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/game.css';
import { loadAssetManifest } from './game/systems/AssetManifestLoader';

loadAssetManifest().then(() => ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
