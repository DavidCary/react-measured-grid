import React from 'react';
import './App.css';
import QuoteGrid from './QuoteGrid.js';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Paired Quotes grid with variable height rows.
        </p>
      </header>
      <nav>
        <div><a href='../../index.md'>react-measured-grid API</a></div>
        <div><a href='https://github.com/DavidCary/react-measured-grid'>repo</a></div>
      </nav>
      <main className="App-main">
        <QuoteGrid />
      </main>
    </div>
  );
}

export default App;
