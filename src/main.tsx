import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StudyProvider } from './state/StudyProvider';
import { PwaProvider } from './pwa/PwaProvider';
import './styles/reference.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(<PwaProvider><StudyProvider><App /></StudyProvider></PwaProvider>);
