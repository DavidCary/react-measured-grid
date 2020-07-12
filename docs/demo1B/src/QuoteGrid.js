/* */
// Copyright (c) 2020, David Cary, MIT License
import React from 'react';
import {getPairedQuotes} from 'react-measured-grid';
import {Grid, CellMeasurer, CellMeasurerCache} from 'react-virtualized';

const maxNbrRows = 137000;
const errorStyle = {backgroundColor: '#faa'}

class QuoteGrid extends React.Component {
  columns = [
    {width: null, className: 'col-seq'},
    {width: null, className: 'col-attribution set1'},
    {width: null, className: 'col-quote set1'},
    {width: null, className: 'col-attribution set2'},
    {width: 400, className: 'col-quote set2'},
  ];

  constructor(props) {
    super(props);
    this.state = {
      nbrRows: 501,
      nbrRowsOK: true,
      rowIndex: -1,
      rowIndexOK: true,
      columnIndex: 0,
      message: 'ok',
    };

    this.usePaired = true;
    this.getRowData = function (nbrRows, usePaired) {
      return getPairedQuotes(nbrRows);
    }
    this.gridRef = React.createRef();
    this.quoteData = this.getRowData(this.state.nbrRows, this.usePaired);
    this.cache = this.getCache();
  }

  validateNbrRows(nbrRows) {
    const value = Number(nbrRows);
    let message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Number of Rows is not a number.';
    } else if (value < 0) {
      message = 'Error: Number of Rows is less than zero.';
    } else if (value > maxNbrRows) {
      message = `Error: Number of Rows is too big (> ${maxNbrRows}).`;
    } else if (!Number.isInteger(value)) {
      message = 'Error: Number of Rows is not an integer.';
    }
    const isValid = message === 'ok';
    return {nbrRows: value, message, nbrRowsOK: isValid};
  }
    
  validateRowIndex(rowIndex) {
    const value = Number(rowIndex);
    let message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Row Index is not a number.';
    } else if (value < -this.quoteData.length) {
      message = `Error: Row Index is too small (< ${-this.quoteData.length})`;
    } else if (value >= this.quoteData.length) {
      message = `Error: Row Index is too big (>= ${this.quoteData.length}).`;
    } else if (!Number.isInteger(value)) {
      message = 'Error: Row Index is not an integer.';
    }
    const isValid = message === 'ok';
    return {rowIndex: value, message, rowIndexOK: isValid};
  }
    
  dataResize() {
    let {nbrRows, nbrRowsOK, message} = this.validateNbrRows(this.state.nbrRows);
    if (nbrRowsOK) {
      if (nbrRows !== this.quoteData.length) {
        this.quoteData = this.getRowData(nbrRows, this.usePaired);
      }
    }
    this.setState({nbrRows, nbrRowsOK, message});
  }

  positionAt() {
    let {rowIndex, rowIndexOK, message} = this.validateRowIndex(this.state.rowIndex);
    const columnIndex = this.state.columnIndex; 
    
    const itemCount = this.quoteData.length;
    if (rowIndexOK) {
      const toRowIndex = rowIndex < 0 ?
            itemCount + rowIndex :
            rowIndex;
      //const rowPosition = new ScrollPosition(toRowIndex, alignment, rowOffset);
      this.gridRef.current.scrollToCell({columnIndex, rowIndex: toRowIndex});
    }
    this.setState({rowIndex, rowIndexOK, columnIndex, message});
  }

  onChangeNbrRows(event) {
    const nbrRows = event.target.value;
    const {nbrRowsOK, message} = this.validateNbrRows(nbrRows);
    this.setState({nbrRows, nbrRowsOK, message});
  }

  onChangeRowIndex(event) {
    const rowIndex = event.target.value;
    const {rowIndexOK, message} = this.validateRowIndex(rowIndex);
    this.setState({rowIndex, rowIndexOK, message});
  }

  onChangeColumnIndex(event) {
    const columnIndex = event.target.value;
    const {columnIndexOK, message} = this.validateRowIndex(columnIndex);
    this.setState({columnIndex, columnIndexOK, message});
  }

  render() {
    document.title='Demo1B: MeasuredGrid';
    return (
      <div id="quote-grid">
        <h1>Demo 1B: React-Virtualized Grid</h1>
        <div id='intro' style={{maxWidth: '90ex'}}>
          <p style={{marginBottom: '0.3em'}}>
            Scroll backwards over rows not previously displayed<br/>
            to see the jerkier movement that can happen with the older react-virtualized package.
          </p>
        </div>
        <div id='quote-grid-message'
              style={this.state.message.substr(0,5).toUpperCase() === "ERROR" ?
                errorStyle : this.state.message === 'ok' ? {visibility: 'hidden'} : {}}
              >{this.state.message}</div>
        <table>
          <tbody>
            <tr id="resizing">
              <td>
                <button id="resize"
                  onClick={event => this.dataResize()}
                >Resize</button>
              </td>
              <td className="label"> Number of Rows: </td>
              <td>
                <input id='nbr-rows' size='5' value={this.state.nbrRows}
                  style={this.state.nbrRowsOK ? {} : errorStyle}
                  onChange={event => this.onChangeNbrRows(event)}
                />
              </td>
            </tr>
            <tr id="position-at">
              <td>
                <button id="position-at"
                  onClick={event => this.positionAt()}
                >Position At</button>
              </td>
              <td className="label"> Row Index: </td>
              <td>
                <input id='rows-index' size='5' value={this.state.rowIndex}
                  style={this.state.rowIndexOK ? {} : errorStyle}
                  onChange={event => this.onChangeRowIndex(event)}
                />
              </td>
              <td className="label"> Column Index: </td>
              <td>
                <select id='column-index' value={this.state.columnIndex}
                  onChange={event => this.onChangeColumnIndex(event)}
                >
                  <option value='0'>0 - Sequence</option>
                  <option value='1'>1 - Attribution 1</option>
                  <option value='2'>2 - Quote 1</option>
                  <option value='3'>3 - Attribution 2</option>
                  <option value='4'>4 - Quote 2</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <Grid
          cellRenderer={arg => this.cellRenderer(arg)}
          columnCount={5}
          columnWidth={({index}) => this.getColumnWidth(index)}
          height={300}
          rowCount={this.quoteData.length}
          estimatedRowSize={20}
          ref={this.gridRef}
          rowHeight={this.cache.rowHeight}
          deferredMeasurementCache={this.cache}
          width={800}
          scrollToRow={this.quoteData.length - 1}
        />
        <div>End of page! Really!</div>
      </div>
    );
  }

  cellRenderer ({ rowIndex, columnIndex, key, style, parent }) {
    return (
      <CellMeasurer 
        key={key}
        cache={this.cache}
        parent={parent}
        columnIndex={columnIndex}
        rowIndex={rowIndex}>
          <div
            style={{...style, width: this.getColumnWidth(columnIndex), boxSizing: 'border-box'}}
            cellkey={key}
            className={this.columns[columnIndex].className + ' grid-cell'}
          >
            <div>
              {this.quoteData[rowIndex][columnIndex]}
            </div>
          </div>
      </CellMeasurer>

    );  
  }

  getCache() {
    return new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 20,
      minHeight: 12
    });
  }

  getColumnWidth(index) {
    return [50, 200, 450, 150, 450][index];
  }
}

export default QuoteGrid;

