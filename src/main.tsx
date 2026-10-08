import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StudyProvider } from './state/StudyProvider';
import './styles/reference.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(<StudyProvider><App /></StudyProvider>);
