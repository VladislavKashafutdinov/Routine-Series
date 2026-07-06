import { LangSwitcher } from './components/LangSwitcher';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Routine Series</h1>
        <LangSwitcher />
      </header>
      <main className="app-main">
        {/* UI будет добавляться по задачам */}
      </main>
    </div>
  );
}
