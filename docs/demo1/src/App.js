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
        <div><a href='../..'>react-measured-grid API</a></div>
        <div><a href='https://github.com/DavidCary/react-measured-grid'>repo</a></div>
        <div><a href='../../demos.html'>demos</a></div>
        <div class='inactive-link'>Demo 1</div>
        <div><a href='../../demo1B/build'>Demo 1B</a></div>
        <div><a href='../../demo1C'>Demo 1C</a></div>
      </nav>
      <main className="App-main">
        <QuoteGrid />
      </main>
    </div>
  );
}

export default App;
