import React from 'react';
import './App.css';
import QuoteGrid from './QuoteGrid.js';


function App() {
  return (
    <div className="App">
      <nav>
        <div><a href='../..'>react-measured-grid API</a></div>
        <div><a href='https://github.com/DavidCary/react-measured-grid'>repo</a></div>
        <div><a href='../../demos.html'>demos</a></div>
        <div><a href='../../demo1/build'>Demo 1</a></div>
        <div class='inactive-link'>Demo 1B</div>
        <div><a href='../../demo1C'>Demo 1C</a></div>
      </nav>
      <main className="App-main">
        <QuoteGrid />
      </main>
    </div>
  );
}

export default App;
