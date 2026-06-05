import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// No global CSS — game is fully canvas + inline styles
createRoot(document.getElementById('root')!).render(<App />);
