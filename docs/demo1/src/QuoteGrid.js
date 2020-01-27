/**/
// Copyright (c) 2020, David Cary, MIT License

import React from 'react';
import {getPairedQuotes} from 'react-measured-grid';
import {MeasuredGrid} from 'react-measured-grid';
import {PositionTracker} from 'react-measured-grid';
import {ScrollPosition} from 'react-measured-grid';

const maxNbrRows = 137000;
const minQuoteExWidth = 10;
const maxQuoteExWidth = 2000;
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
      nbrRows: 85,
      nbrRowsOK: true,
      quoteExWidth: 45,
      quoteExWidthUsed: 45,
      quoteExWidthOK: true,
      rowIndex: -1,
      rowIndexOK: true,
      alignment: 'end',
      alignmentOK: true,
      rowOffset: 0,
      rowOffsetOK: true,
      message: 'ok',
    };
    this.gridRef = React.createRef();
    this.quoteData = getPairedQuotes(this.state.nbrRows);
    this.rowTracker = new PositionTracker(this.quoteData.length, 55, 15);
    this.rowPosition = new ScrollPosition();
    this.columnTracker = new PositionTracker(this.columns.length, 80, 40);
    this.columnPosition = new ScrollPosition();
  }

  gridCell = ({rowIndex, columnIndex, isScrolling}) => {
    const row = this.quoteData[rowIndex];
    const cell = (
      <div>
        {row[columnIndex]}
      </div>
    );  
    return cell;
  }

  validateNbrRows(nbrRows) {
    const value = Number(nbrRows);
    let message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Number of Rows is not a number.';
    } else if (value < 0) {
      message = 'Error: Number of Rows is less than zero.';
    } else if (value >= maxNbrRows) {
      message = `Error: Number of Rows is too big (>= ${maxNbrRows}).`;
    } else if (!Number.isInteger(value)) {
      message = 'Error: Number of Rows is not an integer.';
    }
    const isValid = message === 'ok';
    return {nbrRows: value, message, nbrRowsOK: isValid};
  }
    
  validateQuoteExWidth(quoteExWidth) {
    const value = Number(quoteExWidth);
    let message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Quote Width is not a number.';
    } else if (value < minQuoteExWidth) {
      message = `Error: Quote Width is too small (< ${minQuoteExWidth})`;
    } else if (value > maxQuoteExWidth) {
      message = `Error: Quote Width is too big (> ${maxQuoteExWidth}).`;
    }
    const isValid = message === 'ok';
    return {quoteExWidthUsed: value, message, quoteExWidthOK: isValid};
  }

  validateRowOffset(rowOffset) {
    const value = Number(rowOffset);
    let message = 'ok';
    const maxOffset = maxNbrRows * 20;
    if (isNaN(value)) {
      message = 'Error: Offset is not a number.';
    } else if (value < -maxOffset) {
      message = `Error: Offset is too small (< ${-maxOffset})`;
    } else if (value > maxOffset) {
      message = `Error: Offset is too big (> ${maxOffset}).`;
    }
    const isValid = message === 'ok';
    return {rowOffset: value, message, rowOffsetOK: isValid};
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
    const {quoteExWidthUsed, quoteExWidthOK, message: message2} =
          this.validateQuoteExWidth(this.state.quoteExWidth);
    if (nbrRowsOK && quoteExWidthOK) {
      if (nbrRows !== this.quoteData.length) {
        this.quoteData = getPairedQuotes(nbrRows);
        this.rowTracker.setItemCount(nbrRows);
      }
    } else if (nbrRowsOK && !quoteExWidthOK) {
      message = message2;
    }
    this.setState({nbrRows, nbrRowsOK, quoteExWidthUsed, quoteExWidthOK, message});
  }

  positionAt() {
    let {rowIndex, rowIndexOK, message} = this.validateRowIndex(this.state.rowIndex);
    const {rowOffset, rowOffsetOK, message2} = this.validateRowOffset(this.state.rowOffset);
    const alignment = this.state.alignment; 
    
    const itemCount = this.quoteData.length;
    if (rowIndexOK && rowOffsetOK) {
      const toRowIndex = rowIndex < 0 ?
            itemCount + rowIndex :
            rowIndex;
      const rowPosition = new ScrollPosition(toRowIndex, alignment, rowOffset);
      this.gridRef.current.positionAt(rowPosition);
    } else if (rowIndexOK && !rowOffsetOK) {
      message = message2;
    }
    this.setState({rowIndex, rowIndexOK, rowOffset, rowOffsetOK, message});
  }

  auditRowTracker() {
    this.rowTracker.audit();
  }

  onChangeNbrRows(event) {
    const nbrRows = event.target.value;
    const {nbrRowsOK, message} = this.validateNbrRows(nbrRows);
    this.setState({nbrRows, nbrRowsOK, message});
  }

  onChangeQuoteExWidth(event) {
    const quoteExWidth = event.target.value;
    const {quoteExWidthOK, message} = this.validateQuoteExWidth(quoteExWidth);
    this.setState({quoteExWidth, quoteExWidthOK, message});
  }

  onChangeRowIndex(event) {
    const rowIndex = event.target.value;
    const {rowIndexOK, message} = this.validateRowIndex(rowIndex);
    this.setState({rowIndex, rowIndexOK, message});
  }

  onChangeAlignment(event) {
    const message = 'ok';
    const alignmentOK = true;
    const alignment = event.target.value;
    this.setState({alignment, alignmentOK, message});
  }

  onChangeRowOffset(event) {
    const rowOffset = event.target.value;
    const {rowOffsetOK, message} = this.validateRowOffset(rowOffset);
    this.setState({rowOffset, rowOffsetOK, message});
  }

  render() {
    document.title='Demo1: MeasuredGrid';
    return (
      <div id="quote-grid">
        <h1>Demo 1: MeasuredGrid</h1>
        <div id='intro' style={{maxWidth: '90ex'}}>
          <p style={{marginBottom: '0.3em'}}>
            This is a demo of a MeasuredGrid that displays pairs of quotes.
            Quotes are listed with pseudorandom but fixed ordering and pairings.
            You can use the inputs below to:
          </p>
          <ul style={{marginTop: '0.3em'}}>
            <li>Change the number of rows in the grid.</li>
            <li>Change the width of the first quote, using CSS in a dynamic style element.</li>
            <li>Vertically reposition the grid with the attributes of a ScrollPosition instance.</li>
            <li>Manually scroll horizontally and vertically.</li>
            <li>Resize the view window.</li>
          </ul>
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
              <td className="label"><label for='nbr-rows'>Number of Rows: </label></td>
              <td>
                <input id='nbr-rows' size='5' value={this.state.nbrRows}
                  style={this.state.nbrRowsOK ? {} : errorStyle}
                  onChange={event => this.onChangeNbrRows(event)}
                />
              </td>
              <td className="label"><label for='quote-width'>Quote Width (ex): </label></td>
              <td>
                <input id='quote-width' size='3' value={this.state.quoteExWidth}
                  style={this.state.quoteExWidthOK ? {} : errorStyle}
                  onChange={event => this.onChangeQuoteExWidth(event)}
                />
              </td>
            </tr>
            <tr id="position-at">
              <td>
                <button id="position-at"
                  onClick={event => this.positionAt()}
                >Position At</button>
              </td>
              <td className="label"><label for='rows-index'>Row Index: </label></td>
              <td>
                <input id='rows-index' size='5' value={this.state.rowIndex}
                  style={this.state.rowIndexOK ? {} : errorStyle}
                  onChange={event => this.onChangeRowIndex(event)}
                />
              </td>
              <td className="label"><label for='alignment'>Alignment: </label></td>
              <td>
                <select id='alignment' value={this.state.alignment}
                  onChange={event => this.onChangeAlignment(event)}
                >
                  <option value='start'>top</option>
                  <option value='center'>center</option>
                  <option value='end'>bottom</option>
                </select>
              </td>
              <td className="label"><label for='row-offset'>Offset (px): </label></td>
              <td>
                <input id='row-offset' size='3' value={this.state.rowOffset}
                  style={this.state.rowOffsetOK ? {} : errorStyle}
                  onChange={event => this.onChangeRowOffset(event)}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <style>
          {".col-quote.set1 { width: "+(this.state.quoteExWidthUsed)+"ex;}"}
        </style>
        <MeasuredGrid
          columnClassName={index => this.columns[index].className}
          columnTracker={this.columnTracker}
          columnPositionInitial={this.columnPosition}
          columnWidth={index => this.columns[index].width}
          ref={this.gridRef}
          rowTracker={this.rowTracker}
          rowPositionInitial={this.rowPosition}
          viewId='quote-grid-view'
        >
          {(rowIndex, columnIndex, isScrolling) => this.gridCell(rowIndex, columnIndex, isScrolling)}
        </MeasuredGrid>
      </div>
    );
  }
}

export default QuoteGrid;

