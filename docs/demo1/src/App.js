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
      <main className="App-main">
        <QuoteGrid />
      </main>
    </div>
  );
}

export default App;
