
// @flow
// Copyright (c) 2020, David Cary, MIT License

import React from 'react';
import { cancelTimeout, requestTimeout } from './timer';
import { getScrollbarSize, getRTLOffsetType } from './domHelpers';
import PositionTracker from './PositionTracker.js';
import ScrollPosition from './ScrollPosition.js';
import ErrBoundary from './ErrBoundary';
import { isFiniteNumber, isFiniteNumberBetween, isArray } from './utils';

import type { TimeoutID } from './timer';

type Direction = 'ltr' | 'rtl';

type ColumnClassNameFunction = number => string;
type ColumnClassName = string |
  ColumnClassNameFunction |
  Array<string>;

type ColumnWidthValue = string | number | null;
type ColumnWidthFunction = number => ColumnWidthValue;
type ColumnWidth = string | number | null |
  ColumnWidthFunction |
  Array<ColumnWidthValue>;

type Style = {[key: string]: string | number};
type ColumnStyleFunction = number => Style;
type ColumnStyle = Style | Array<Style> | ColumnStyleFunction;



type RenderComponentProps<T> = {|
  columnIndex: number,
  data: T,
  isScrolling?: boolean,
  rowIndex: number,
  style: Style,
|};

type RenderComponent<T> = React$ComponentType<
  $Shape<RenderComponentProps<T>>
>;


type ScrollEvent = SyntheticEvent<HTMLDivElement>;
type Actions = {[name: string]: (mixed) => (mixed)} | {unmount: null};

export type Props = {|
  children?: any,
  columnClassName: ColumnClassName,
  columnCountInitial?: number,
  columnPositionInitial: ScrollPosition,
  columnStyle: ColumnStyle,
  columnTracker?: PositionTracker | number,
  columnWidth: ColumnWidth,
  dataArray?: Array<mixed>,
  //direction?: Direction,
  itemKey: (rowIndex: number, columnIndex: number | string) => string,
  overscanRowCount: number,
  rowCountInitial?: number,
  rowPositionInitial: ScrollPosition,
  rowTracker?: PositionTracker,
  viewId?: string,
  viewClassName?: string,
  viewHeightInitial?: number | string,
  viewStyle: Style,
  viewWidthInitial?: number | string,
|};

type State = {|
  instance: any,
  isScrolling: boolean,
  rowPosition: ScrollPosition,
  columnPosition: ScrollPosition,
|};

type SetState = {|
  instance?: any,
  isScrolling?: boolean,
  rowPosition?: ScrollPosition,
  columnPosition?: ScrollPosition,
|};

type ViewDimensions = {
  height: number,
  innerHeight: number,
  innerWidth: number,
  width: number,
};

type ItemRange = {|
  start: number,
  end: number
|};

type ReactDivRef = {current: HTMLDivElement | null};
type GridContainers = {
  domView: HTMLDivElement,
  domBase: HTMLDivElement,
  domRendered: HTMLDivElement
};

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
const DEFAULT_VIEW_HEIGHT = 0;
const DEFAULT_VIEW_WIDTH = 0;
const EQUAL_HEIGHT_THRESHOLD = 0.01

const defaultItemKey = (
  columnIndex: number,
  rowIndex: number | string
  ): string => `(${rowIndex}:${columnIndex})`;

export default
class MeasuredGrid extends React.Component<Props, State> {
  _columnClassNameSaved: ColumnClassName = '';
  _columnClassNameFunction: ColumnClassNameFunction = (
        (index: number): string => '');
  _columnCountInitial: any;
  _columnStyleSaved: ColumnStyle | null = null;
  _columnStyleFunction: ColumnStyleFunction = (
        (index: number): Style => ({}));
  _columnTracker: PositionTracker;
  _columnWidthSaved: ColumnWidth = null;
  _columnWidthFunction: ColumnWidthFunction = (
        (index: number): null => null);
  _dataArray: Array<any> | null;
  _dataArrayLengthSaved: number | null;
  _gridbaseRef: ReactDivRef = React.createRef();
  _isMounted = false;
  _lastScrollTop: number = 0;
  _lastScrollLeft: number = 0;
  _renderedRef: ReactDivRef = React.createRef();
  _renderedRowRange: ItemRange = {start: 0, end: 0};
  _resetIsScrollingTimeoutId: TimeoutID | null = null;
  _rowCountInitial: any;
  _rowTracker: PositionTracker;
  _totalWidth: number;
  _viewDimensions: ViewDimensions;
  _viewRef: ReactDivRef = React.createRef();
  _visibleRowRange: ItemRange = {start: 0, end: 0};

 
  static defaultProps = {
    //direction: 'ltr',
    columnClassName: '',
    columnStyle: null,
    columnWidth: null,
    columnPositionInitial: new ScrollPosition(),
    rowPositionInitial: new ScrollPosition(),
    overscanRowCount: 1,
    viewStyle: {},
    itemKey: defaultItemKey,
  };

  constructor(props: Props) {
    super(props);
    if (this.props.rowTracker instanceof PositionTracker) {
      this._rowTracker = this.props.rowTracker;
    } else {
      let rowCount = this.props.rowCountInitial;
      this._rowCountInitial = rowCount;
      if (!isFiniteNumberBetween(rowCount, 0, Infinity)) {
        rowCount = 0;
      }
      if (Array.isArray(this.props.dataArray)) {
        rowCount = this.props.dataArray.length;
      }
      this._rowTracker = new PositionTracker(rowCount);
    }
    if (this.props.columnTracker instanceof PositionTracker) {
      this._columnTracker = this.props.columnTracker;
    } else {
      let columnCount = this.props.columnCountInitial;
      this._columnCountInitial = columnCount;
      if (!isFiniteNumberBetween(columnCount, 0, Infinity)) {
        columnCount = 1;
      }
      this._columnTracker = new PositionTracker(columnCount);
    }

    let rowPosition = this.props.rowPositionInitial;
    if (!(rowPosition instanceof ScrollPosition) ||
          rowPosition.getIndex() < 0) {
      rowPosition = new ScrollPosition();
    }
    const rowItemCount = this._rowTracker.getItemCount(); 
    if (rowPosition.getIndex() >= rowItemCount) {
      rowPosition = new ScrollPosition(
            rowItemCount ? rowItemCount - 1 : 0, 'end', 0);
    }
    let columnPosition = this.props.columnPositionInitial;
    if (columnPosition.getIndex() < 0) {
      columnPosition = new ScrollPosition();
    }
    const columnItemCount = this._columnTracker.getItemCount(); 
    if (columnPosition.getIndex() >= columnItemCount) {
      columnPosition = new ScrollPosition(
            columnItemCount ? columnItemCount - 1 : 0, 'end', 0);
    }
      
    this._totalWidth = this._getTotalWidth();
    const viewHeight = isFiniteNumberBetween(
          this.props.viewHeightInitial, 0) ?
          this.props.viewHeightInitial : -1;
    const viewWidth = isFiniteNumberBetween(
          this.props.viewWidthInitial, 0) ?
          this.props.viewWidthInitial : -1;
    this._viewDimensions = {
      height: viewHeight,
      innerHeight: viewHeight,
      innerWidth: viewWidth,
      width: viewWidth,
    };

    this._columnClassNameFunction = this._checkColumnClassNameFunction(true);
    this._columnStyleFunction = this._checkColumnStyleFunction(true);
    this._columnWidthFunction = this._checkColumnWidthFunction(true);

    this.state = {
      isScrolling: false,
      rowPosition: rowPosition,
      columnPosition: columnPosition,
      instance: this,
    }
  }

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State
  ): $Shape<State> | null {

    const that = prevState.instance;
    if (nextProps.rowTracker instanceof PositionTracker) {
      that._rowTracker = nextProps.rowTracker;
    } else if (!(that._rowTracker instanceof PositionTracker)) {
      let rowCount = that._rowCountInitial;
      if (!isFiniteNumberBetween(rowCount, 0, Infinity)) {
        rowCount = 0;
      }
      if (Array.isArray(nextProps.dataArray)) {
        rowCount = nextProps.dataArray.length;
      }
      that._rowTracker = new PositionTracker(rowCount);
    }
    if (nextProps.columnTracker instanceof PositionTracker) {
      that._columnTracker = nextProps.columnTracker;
    } else if (!(that._columnTracker instanceof PositionTracker)) {
      let columnCount = that._columnCountInitial;
      that._columnCountInitial = columnCount;
      if (!isFiniteNumberBetween(columnCount, 0, Infinity)) {
        columnCount = 1;
      }
      that._columnTracker = new PositionTracker(columnCount);
    }
 
    const dataArrayLength: number | null = nextProps.dataArray ?
          nextProps.dataArray.length : null;
    if (dataArrayLength !== null &&
          dataArrayLength !== that._rowTracker.getItemCount()) {
      that._rowTracker.setItemCount(dataArrayLength);
    }
    const nbrRows = that._rowTracker.getItemCount();
    let rowResult = null;
    const rowIndex = prevState.rowPosition.getIndex();
    if ((nbrRows === 0 && rowIndex > 0) ||
          (nbrRows > 0 && rowIndex >= nbrRows)) {
      rowResult = {rowPosition: nbrRows ?
            new ScrollPosition(nbrRows - 1, 'end', 0) :
            new ScrollPosition(0, 'start', 0)
            };
    }
    const nbrColumns = that._columnTracker.getItemCount();
    let columnResult = null;
    const columnIndex = prevState.columnPosition.getIndex();
    if ((nbrColumns === 0 && columnIndex > 0) ||
          (nbrColumns > 0 && columnIndex >= nbrColumns)) {
      columnResult = {columnPosition: nbrColumns ?
            new ScrollPosition(nbrColumns - 1, 'end', 0) :
            new ScrollPosition(0, 'start', 0)
            };
    }
    let result = null;
    if (rowResult || columnResult) {
      result = Object.assign({}, rowResult || {}, columnResult || {});
    }
    return result;
  }

  componentDidMount() {
    this._isMounted = true;

    const gridContainers: GridContainers | null = this._findGridContainers();
    if (gridContainers) {
      this._measureColumns(gridContainers);
      this._adjustColumnPositioning(gridContainers);
      this._measureRows(gridContainers);
      this._adjustRowPositioning(gridContainers);
    }
  }

  componentDidUpdate() {
    const gridContainers: GridContainers | null = this._findGridContainers();
    if (gridContainers) {
      this._measureColumns(gridContainers);
      this._adjustColumnPositioning(gridContainers);
      this._measureRows(gridContainers);
      this._adjustRowPositioning(gridContainers);
    }
  }

  componentWillUnmount() {
    if (this._resetIsScrollingTimeoutId !== null) {
      cancelTimeout(this._resetIsScrollingTimeoutId);
    }
    this._isMounted = false;
  }

  getScrollPositions(): {
    column: ScrollPosition,
    isScrolling: boolean,
    row: ScrollPosition,
  } {
    const result = {
      row: this.state.rowPosition.copy(),
      column: this.state.columnPosition.copy(),
      isScrolling: this.state.isScrolling,
    }
    return result;
  }

  positionAt(rowPosition?: ScrollPosition, columnPosition?: ScrollPosition): void {
    this._viewDimensions = this._getViewDimensions();
    const viewHeight = this._viewDimensions.innerHeight;
    const viewWidth = this._viewDimensions.innerWidth;

    const newColumnPosition = columnPosition ?
          columnPosition :
          //columnPosition.withContainingIndex(this._columnTracker, viewWidth):
          this.state.columnPosition;
    const newRowPosition = rowPosition ?
          rowPosition :
          //rowPosition.withContainingIndex(this._rowTracker, viewHeight):
          this.state.rowPosition;
    this.setState({rowPosition: newRowPosition, columnPosition: newColumnPosition});
  }      

  render(): any {
    const {
      children,
      columnStyle,
      columnWidth,
      //direction,
      itemKey,
      viewClassName,
      viewStyle,
    } = this.props;
    const {
      isScrolling,
      rowPosition,
    } = this.state;
    const direction = 'ltr';

    const rowTracker = this._rowTracker;
    const columnTracker = this._columnTracker;

    this._totalWidth = this._getTotalWidth();
    this._viewDimensions = this._getViewDimensions();
    const [
      columnStartIndex,
      columnStopIndex,
    ] = this._getColumnRangeToRender();
    const [
      renderRowStart,
      renderRowStop
    ] = this._getRowRangeToRender(
          rowPosition, this._viewDimensions.innerHeight || 0);

    const columnCount = columnTracker.getItemCount();
    let rowCount = rowTracker.getItemCount();
    this._checkColumnClassNameFunction();
    this._checkColumnStyleFunction();
    const useDataArray = Array.isArray(this.props.dataArray) &&
          children === undefined;

    const rows = [];
    const viewDimensionStyle = {};
    if (this.props.viewStyle && this.props.viewStyle.width !== undefined) {
      viewDimensionStyle.width = this.props.viewStyle.width;
    } else if (isFiniteNumberBetween(this._viewDimensions.width, 0, Infinity)) {
      viewDimensionStyle.width = this._viewDimensions.width;
    }
    if (this.props.viewStyle && this.props.viewStyle.height !== undefined) {
      viewDimensionStyle.height = this.props.viewStyle.height;
    } else if (isFiniteNumberBetween(this._viewDimensions.height, 0, Infinity)) {
      viewDimensionStyle.height = this._viewDimensions.height;
    }
    if (columnCount > 0 && rowCount) {
      for (
        let rowIndex = renderRowStart;
        rowIndex <= renderRowStop;
        rowIndex++
      ) {
        const cells = [];
        for (
          let columnIndex = columnStartIndex;
          columnIndex <= columnStopIndex;
          columnIndex++
        ) {
          let cellStyle = {};
          cellStyle.display = 'inline-block';
          cellStyle.boxSizing = 'border-box';
          const cellColumnStyle = this._columnStyleFunction(columnIndex);
          Object.assign(cellStyle, cellColumnStyle);
          const cellStyleWidth = this._columnWidthFunction(columnIndex);
          if (typeof cellStyleWidth === 'number' ||
                typeof cellStyleWidth === 'string') {
            cellStyle.width = cellStyleWidth;
          }
          let cellClassName = this._columnClassNameFunction(columnIndex);
          cellClassName = typeof cellClassName === 'string' ? cellClassName : '';
          const cellKey = (itemKey && typeof itemKey === 'function' ?
                itemKey : defaultItemKey)(rowIndex, columnIndex);
          let child: any;
          if (typeof children === 'function') {
            child = children(rowIndex, columnIndex, isScrolling);
          } else if (useDataArray) {
            child = this._childrenFromDataArray(rowIndex, columnIndex);
          } else {
            child = children;
          }
          const cell = React.createElement(
            'div',
            {
              className: 'grid-cell ' +
                (cellClassName === '' ? '' : ' ' + cellClassName),
              columnindex: columnIndex,
              key: cellKey,
              datakey: cellKey,
              style: cellStyle,
            },
            <ErrBoundary>
              { child }
            </ErrBoundary>
          );
          cells.push(cell);
        }
        const rowKey = (itemKey && typeof itemKey === 'function' ?
              itemKey : defaultItemKey)(rowIndex, 'row');
        const row = React.createElement('div', {
            rowindex: rowIndex,
            className: 'grid-row '+ (rowIndex % 2 ? 'odd' : 'even'),
            key: rowKey,
            datakey: rowKey,
            style: {boxSizing: 'border-box'},
            },
            cells
        );
        rows.push(<ErrBoundary key={"errboundry-"+rowIndex}>{row}</ErrBoundary>);
      }
    }

    const startRowOffset = rowTracker.getItemStats(
          renderRowStart).start;

    const baseStyle = {
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          direction,
        };
    const fullViewStyle: any = Object.assign({}, baseStyle,
          viewDimensionStyle, viewStyle);

    const result = React.createElement(
      'div',
      {
        id: this.props.viewId,
        className: 'grid-view' + (viewClassName ? ' ' + viewClassName : ''),
        ref: this._viewRef,
        style: fullViewStyle,
        onScroll: (evt: ScrollEvent): void => this._onScroll(evt),
        onClick: (evt: ScrollEvent): void => this._onResize(evt),
 
      },
      React.createElement(
        'div',
        {
          ref: this._gridbaseRef,
          className: 'grid-base',
          style: {
            position: 'relative',
            height: rowTracker.getTotalSize(),
            pointerEvents: isScrolling ? 'none' : undefined,
            width: this._totalWidth,
          },
        },
        React.createElement(
          'div',
          {
            ref: this._renderedRef,
            className: 'rendered-rows',
            style: {
              position: 'absolute',
              top: startRowOffset,
            },
          },
          rows
        )
      )
    );
    return (
      <ErrBoundary>
        {result}
      </ErrBoundary>
    );
  }

  _adjustColumnPositioning(gridContainers: GridContainers) {
    const columnTracker = this._columnTracker;
    const {columnPosition} = this.state;
    const {domView, domBase, domRendered} = gridContainers;

    const viewScrollLeft = domView.scrollLeft;
    this._viewDimensions = this._getViewDimensions();
    const viewWidth = this._viewDimensions.innerWidth;
    const maxGridOffset = Math.max(0, this._totalWidth - viewWidth);
    let viewLeftGridOffset = columnPosition.getViewStartOffset(
          columnTracker, viewWidth);
    if (viewLeftGridOffset > maxGridOffset) {
      columnPosition.update(columnTracker.getItemCount() - 1, 'end', 0);
      viewLeftGridOffset = columnPosition.getViewStartOffset(
            columnTracker, viewWidth);
    }
    if (viewLeftGridOffset < 0) {
      columnPosition.update(0, 'start', 0);
      viewLeftGridOffset = columnPosition.getViewStartOffset(
            columnTracker, viewWidth);
    }
    let viewRightGridOffset = viewLeftGridOffset + viewWidth;

    if (!this.state.isScrolling) {
      if (viewScrollLeft !== viewLeftGridOffset) {
        domView.scrollLeft = viewLeftGridOffset;
      }
    }
    const newWidth = this._totalWidth + 'px';
    if (domBase.style.width !== newWidth) {
      domBase.style.width = this._totalWidth + 'px';
    }
    this._lastScrollLeft = domView.scrollLeft;
  }

  _adjustRowPositioning(gridContainers: GridContainers) {
    const rowTracker = this._rowTracker;
    const columnTracker = this._columnTracker;
    const rowPosition = this.state.rowPosition;

    const {domView, domBase, domRendered} = gridContainers;
    const viewScrollTop = domView.scrollTop;
    this._viewDimensions = this._getViewDimensions();
    const viewHeight = this._viewDimensions.innerHeight;
    const firstRenderedIndex = this._renderedRowRange.start;
    const firstRenderedRowStats = rowTracker
          .getItemStats(firstRenderedIndex);
    const lastRenderedRow = this._renderedRowRange.end;
    const lastRenderedRowStats = rowTracker
          .getItemStats(lastRenderedRow);
    const totalHeight = rowTracker.getTotalSize();
    const maxGridOffset = totalHeight - viewHeight;
    let viewTopGridOffset = rowPosition.getViewStartOffset(
          rowTracker, viewHeight);
    if (viewTopGridOffset > maxGridOffset) {
      rowPosition.update(rowTracker.getItemCount() - 1, 'end', 0);
      viewTopGridOffset = rowPosition.getViewStartOffset(
            rowTracker, viewHeight);
    }
    if (viewTopGridOffset < 0) {
      rowPosition.update(0, 'start', 0);
      viewTopGridOffset = rowPosition.getViewStartOffset(
            rowTracker, viewHeight);
    }
    let viewBottomGridOffset = viewTopGridOffset + viewHeight;

    if (this.state.isScrolling) {
      const adjustedRenderedRowsTop = viewScrollTop -
            (viewTopGridOffset - firstRenderedRowStats.start);
      const newTop = adjustedRenderedRowsTop + 'px';
      if (domRendered.style.top !== newTop) {
        domRendered.style.top = adjustedRenderedRowsTop + 'px';
      }
    } else {
      const newTop =  firstRenderedRowStats.start + 'px';
      if (domRendered.style.top !== newTop) {
        domRendered.style.top = firstRenderedRowStats.start + 'px';
      }
      if (domRendered.style.top !== viewTopGridOffset) {
      domView.scrollTop = viewTopGridOffset;
      }
    }
    domBase.style.height = totalHeight + 'px';

    this._lastScrollTop = domView.scrollTop;
    const nbrRowItems = rowTracker.getItemCount();
    if (nbrRowItems > 0 && lastRenderedRowStats.end < viewBottomGridOffset - 0.0001 &&
          (this._renderedRowRange.start > 0 ||
          this._renderedRowRange.end < nbrRowItems - 1)) {
      this.setState({rowPosition: rowPosition.copy()});
    }
  }

  _checkColumnClassNameFunction(forceUpdate: boolean = false
        ): ColumnClassNameFunction {
    if (forceUpdate ||
          this._columnClassNameSaved !== this.props.columnClassName) {
      this._columnClassNameSaved = this.props.columnClassName;
      this._columnClassNameFunction = this._makeClassNameFunction(
            this._columnClassNameSaved);
    }
    return this._columnClassNameFunction;
  }

  _checkColumnStyleFunction(forceUpdate: boolean = false
        ): ColumnStyleFunction {
    if (forceUpdate ||
          this._columnStyleSaved !== this.props.columnStyle) {
      this._columnStyleSaved = this.props.columnStyle;
      this._columnStyleFunction = this._makeStyleFunction(
            this._columnStyleSaved);
    }
    return this._columnStyleFunction;
  }

  _checkColumnWidthFunction(forceUpdate: boolean = false
        ): ColumnWidthFunction {
    if (forceUpdate ||
          this._columnWidthSaved !== this.props.columnWidth) {
      this._columnWidthSaved = this.props.columnWidth;
      this._columnWidthFunction = this._makeWidthFunction(
            this._columnWidthSaved);
    }
    return this._columnWidthFunction;
  }

  _childrenFromDataArray(rowIndex: number, columnIndex: number): string {
    let result = '';
    const dataArray = this.props.dataArray;
    if (Array.isArray(dataArray)) {
      const rowData: mixed = dataArray[rowIndex];
      if (Array.isArray(rowData)) {
        const cellData: mixed = rowData[columnIndex];
        if (cellData !== undefined) {
          result = String(cellData);
        }
      }
    }
    return result;
  }

  _findGridContainers(): GridContainers | null {
    let domView = this._getDomRef(this._viewRef); 
    let domBase = this._getDomRef(this._gridbaseRef);
    let domRendered = this._getDomRef(this._renderedRef);

    if (!domView) {
      console.error('ERROR: No view found at this._viewRef.');
    }
    if (!domBase) {
      console.error('ERROR: No grid base found at this._gridbaseRef.');
    }
    if (!domRendered) {
      console.error('ERROR: No rendered rows found at this._renderedRef.');
    }
    let result;
    if (domView === null || domBase === null || domRendered === null) {
      result = null;
    } else {
      result = {domView, domBase, domRendered};
    }
    return result;
  }

  _forceUpdate() {
      this.forceUpdate()
  }

  _getColumnRangeToRender(): [number, number, number, number] {
    const columnCount = this._columnTracker.getItemCount();
    const result = [0, columnCount - 1, 0, columnCount - 1];
    return result;
  }

  _getDomRef(ref: ReactDivRef): HTMLDivElement | null {
    if (ref && ref.current) {
      const div: HTMLDivElement = (ref.current);
      return div;
    }
    return null;
  }

  _getIncrementedPosition(
    scrollPosition: ScrollPosition,
    scrollDelta: number,
    positionTracker: PositionTracker,
    viewSize: number
  ): ScrollPosition {
    const newAlignment = scrollDelta < 0 ? 'end' : 'start';
    const realignedPosition = scrollPosition.changeAlignment(
          newAlignment, positionTracker, viewSize);
    let referencePosition = realignedPosition.incrementOffset(
          scrollDelta);
    const newPosition = referencePosition.withContainingIndex(
          positionTracker, viewSize);
    if (Math.abs(scrollDelta) <= viewSize) {
      referencePosition = newPosition;
    }
    return newPosition;
  }

  _getRowRangeToRender(
    rowPosition: ScrollPosition,
    viewHeight: number
  ): [number, number, number, number] {
    const overscanRowCount = this.props.overscanRowCount;
    const rowTracker = this._rowTracker;
    const columnTracker = this._columnTracker;

    const overscanRowCountNbr = typeof overscanRowCount === 'number' ? overscanRowCount : 1;
    const columnCount = columnTracker.getItemCount();
    const rowCount = rowTracker.getItemCount();

    if (columnCount === 0 || rowCount === 0) {
      this._visibleRowRange = {start: 0, end: -1};
      this._renderedRowRange = {start: 0, end: -1};
      return [0, -1, 0, -1];
    }

    this._visibleRowRange = this._getVisibleRowRange(
      rowTracker,
      rowPosition,
      viewHeight,
    );
    this._renderedRowRange = {
      start: Math.max(0, this._visibleRowRange.start - overscanRowCountNbr),
      end: Math.min(
        rowCount - 1,
        this._visibleRowRange.end + overscanRowCountNbr
      ),
    };
    
    const result = [
      this._renderedRowRange.start,
      this._renderedRowRange.end,
      this._visibleRowRange.start,
      this._visibleRowRange.end
    ];
    return result;
  }

  _getTotalWidth(): number {
    const {
      columnWidth,
    } = this.props;
    const columnTracker = this._columnTracker;
    this._checkColumnWidthFunction();
    const columnCount = columnTracker.getItemCount();
    let totalWidth = 0;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      let cellWidth = this._columnWidthFunction(columnIndex);
      if (cellWidth === null || typeof cellWidth === 'string') {
        cellWidth = columnTracker.getItemSize(columnIndex);
      } else {
        columnTracker.setItemSize(columnIndex, cellWidth);
      }
      totalWidth += cellWidth;
    }
    return totalWidth;
  }

  _getViewDimensions(): ViewDimensions {
    const result = Object.assign({}, this._viewDimensions);
    const scrollbarSize = getScrollbarSize();
    if (this._isMounted) {
      const domView = this._getDomRef(this._viewRef);
      if (domView) {
        const viewRect = domView.getBoundingClientRect();
        if (viewRect) {
          result.width = Math.abs(viewRect.right - viewRect.left);
          result.height = Math.abs(viewRect.bottom - viewRect.top);
          const totalHeight = this._rowTracker.getTotalSize();
          const totalWidth =  this._totalWidth;
          const verticalScrollbarSize = 
                totalHeight > result.height ? scrollbarSize :
                totalHeight < result.height - scrollbarSize ? 0:
                totalWidth > result.width ? scrollbarSize : 0;
          const horizontalScrollbarSize = 
                totalWidth > result.width ? scrollbarSize :
                totalWidth < result.width - scrollbarSize ? 0:
                totalHeight > result.height ? scrollbarSize : 0;
          let otherUnusedHeight = 0;
          let otherUnusedWidth = 0;
          const viewStyle = window.getComputedStyle(domView);
          if (viewStyle) {
            otherUnusedHeight += this._getStyleSize(viewStyle, 'border-top-width');
            otherUnusedHeight += this._getStyleSize(viewStyle, 'border-bottom-width');
            otherUnusedHeight += this._getStyleSize(viewStyle, 'padding-top');
            otherUnusedHeight += this._getStyleSize(viewStyle, 'padding-bottom');
            otherUnusedWidth += this._getStyleSize(viewStyle, 'border-left-width');
            otherUnusedWidth += this._getStyleSize(viewStyle, 'border-right-width');
            otherUnusedWidth += this._getStyleSize(viewStyle, 'padding-left');
            otherUnusedWidth += this._getStyleSize(viewStyle, 'padding-right');

          }

          
          result.innerWidth = result.width - verticalScrollbarSize - otherUnusedWidth;
          result.innerHeight = result.height - horizontalScrollbarSize -
                otherUnusedHeight;
        }
      }
    }
    return result;
  }

  _getStyleSize(style: any, name: string): number {
    let result = 0;
    const value = style.getPropertyValue(name);
    if (typeof value !== 'string') {
      return result;
    }
    let parsed = parseFloat(value);
    if (typeof parsed === 'number' && !isNaN(parsed)) {
      result = parsed;
    }
    return result;
  }

  _getVisibleRowRange(
    rowTracker: PositionTracker,
    scrollPosition: ScrollPosition,
    viewHeight: number
    ): ItemRange {

    const rowCount = rowTracker.getItemCount();
    const viewTop = Math.max(0, scrollPosition.getViewStartOffset(
          rowTracker, viewHeight));
    const totalOffset = scrollPosition.getTotalOffset(rowTracker,
          viewHeight);
    const totalHeight = rowTracker.getTotalSize();
    const viewBottom = Math.min(totalHeight,
          viewTop + viewHeight);
    let rootIndex = scrollPosition.getIndex();
    let rootStats = rowTracker.getItemStats(rootIndex);
    if (totalOffset >= 0 && totalOffset <= totalHeight &&
          (totalOffset < rootStats.start || totalOffset > rootStats.end)) {
      const rootPosition = scrollPosition.withContainingIndex(
            rowTracker, viewHeight);
      rootIndex = rootPosition.getIndex();
      rootStats = rowTracker.getItemStats(rootIndex);
    }
    let visibleRange = {
      start: rootIndex,
      end: rootIndex,
    };
    let startIndex = rootIndex - 1;
    let startBottom = rootStats.start;
    while (startBottom > viewTop && startIndex >= 0) {
      visibleRange.start = startIndex;
      startBottom -= rowTracker.getItemLowSize(startIndex);
      startIndex--;
    }
    let endIndex = rootIndex + 1;
    let endTop = rootStats.end;
    while (endTop <= viewBottom && endIndex < rowCount) {
      visibleRange.end = endIndex;
      endTop += rowTracker.getItemLowSize(endIndex);
      endIndex++;
    }
    let rangeHeight = endTop - startBottom;
    if (rangeHeight < viewHeight) {
      if (visibleRange.end === rowCount - 1) {
        while (rangeHeight < viewHeight && startIndex >= 0) {
          visibleRange.start = startIndex;
          startBottom -= rowTracker.getItemLowSize(startIndex);
          startIndex--;
          rangeHeight = endTop - startBottom;
        }
      }
      if (visibleRange.start === 0) {
        while (rangeHeight < viewHeight && endIndex < rowCount) {
          visibleRange.end = endIndex;
          endTop += rowTracker.getItemLowSize(endIndex);
          endIndex++;
          rangeHeight = endTop - startBottom;
        }
      }
    }
    return visibleRange;
  }

  _makeClassNameFunction(className: any): ColumnClassNameFunction {
    let classFunction: (number) => mixed;
    if (Array.isArray(className)) {
      classFunction = (index: number): mixed => {
        let result = '';
        if (index < className.length) {
          result = className[index];
        } else if (className.length > 0) {
          result = className[className.length - 1];
        }
        return result;
      };
    } else if (typeof className === 'function') {
      classFunction = className;
    } else {
      if (typeof className !== 'string') {
        className = '';
      }
      classFunction = (index: number): mixed => className;
    }
    return (index: number): string => {
      const raw = classFunction(index);
      return typeof raw === 'string' ? raw : '';
    };
  }

  _makeStyleFunction(style: any): ColumnStyleFunction {
    let styleFunction: (number) => mixed;
    if (Array.isArray(style)) {
      styleFunction = (index: number): mixed => {
        let result = {};
        if (index < style.length) {
          result = style[index];
        } else if (style.length > 0) {
          result = style[style.length - 1];
        }
        return result;
      };
    } else if (typeof style === 'function') {
      styleFunction = style;
    } else {
      styleFunction = (index: number): mixed => style;
    }
    return (index: number): any => {
      const raw = styleFunction(index);
      return (typeof raw === 'object' &&
            raw !== null &&
            raw !== undefined) ?
            raw : {};
    }
  }

  _makeWidthFunction(width: any): ColumnWidthFunction {
    let widthFunction: (number) => mixed;
    if (Array.isArray(width)) {
      widthFunction = (index: number): mixed => {
        let result = null;
        if (index < width.length) {
          result = width[index];
        } else if (width.length > 0) {
          result = width[width.length - 1];
        }
        return result;
      };
    } else if (typeof width === 'function') {
      widthFunction = width;
    } else {
      widthFunction = (index: number): mixed => width;
    }
    return (index: number): ColumnWidthValue => {
      const raw = widthFunction(index);
      return (typeof raw === 'number' ||
            typeof raw === 'string' || raw === null) ?
            raw : null;
    }
  }

  _measureColumns(gridContainers: GridContainers) {
    const {domView, domBase, domRendered} = gridContainers;

    const columnTracker = this._columnTracker;
    const columnWidth = this.props.columnWidth;
    let totalWidth = 0;
    let columnCount = 0;
    if (domRendered.children.length > 0) {
      const measuredRow = domRendered.children[0];
      columnCount = measuredRow.children.length;
      const lastcix = measuredRow.children.length - 1;
      for(let cix = 0; cix < measuredRow.children.length; cix++) {
        const columnCell = measuredRow.children[cix];
        const cellRect = columnCell.getBoundingClientRect();
        const measuredWidth = Math.abs(cellRect.right - cellRect.left);
        const givenCellWidth = this._columnWidthFunction(cix);
        if (typeof givenCellWidth === 'number') {
          if (measuredWidth !== givenCellWidth) {
            console.error('ERROR: Column width discrepancy:'+
                  ' measured ('+measuredWidth+') !=='+
                  ' prop columnWidth ('+givenCellWidth+')'+
                  ' for columnIndex='+cix);
          }
        }
        totalWidth += measuredWidth;
        columnTracker.setItemSize(cix, measuredWidth)
      }
    }
    this._totalWidth = totalWidth;
  }

  _measureRows(gridContainers: GridContainers) {
    const {domRendered} = gridContainers;

    const rowTracker = this._rowTracker;

    let rowIndexStart = -99;
    let rowIndexEnd = -99;
    const lastrix = domRendered.children.length - 1;
    for(let rix = 0; rix < domRendered.children.length; rix++) {
      const row = domRendered.children[rix];
      let rowIndex = -1;
      if (row.hasAttribute('rowindex')) {
        const attributes = row.attributes;
        for (let attrIx = 0; attrIx < attributes.length; attrIx++) {
          if (attributes[attrIx].name === 'rowindex') {
            rowIndex = Number(attributes[attrIx].value);
            break;
          }
        }
      }
      if (rix === 0) {
        rowIndexStart = rowIndex;
      }
      rowIndexEnd = rowIndex;
      if (rowIndex >= 0) {
        const rowRect = row.getBoundingClientRect();
        const rowHeight = Math.abs(rowRect.bottom - rowRect.top);
        const oldRowHeight = rowTracker.setItemSize(rowIndex, rowHeight);
      }
    }
  }

  _onResize = (event: ScrollEvent): void => {
      const newViewDimensions = this._getViewDimensions();
      if (newViewDimensions.height !== this._viewDimensions.height ||
            newViewDimensions.width !== this._viewDimensions.width) {
        this._forceUpdate();
      }
  }

  _onScroll = (event: ScrollEvent): void => {
    const {
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    } = event.currentTarget;
    this._totalWidth = this._getTotalWidth();
    const rowTracker = this._rowTracker;
    const columnTracker = this._columnTracker;

    this._viewDimensions = this._getViewDimensions();
    const viewHeight = this._viewDimensions.innerHeight;
    const viewWidth = this._viewDimensions.innerWidth;

    //const { direction } = this.props;
    const direction = 'ltr';
    // TRICKY According to the spec, scrollLeft should be negative for
    // RTL aligned elements. This is not the case for all browsers
    // though (e.g. Chrome reports values as positive, measured relative
    // to the left).  It's also easier for this component if we convert
    // offsets to the same format as they would be in for ltr.
    // So the simplest solution is to determine which browser behavior
    // we're dealing with, and convert based on it.
    let calculatedScrollLeft = scrollLeft;
    if (direction === 'rtl') {
      switch (getRTLOffsetType()) {
        case 'negative':
          calculatedScrollLeft = -scrollLeft;
          break;
        case 'positive-descending':
          calculatedScrollLeft = scrollWidth - clientWidth - scrollLeft;
          break;
        default:
      }
    }

    // Prevent Safari's elastic scrolling from causing visual shaking
    // when scrolling past bounds.
    calculatedScrollLeft = Math.max(0,
          Math.min(calculatedScrollLeft, scrollWidth - clientWidth));
    const calculatedScrollTop = Math.max(0,
          Math.min(scrollTop, scrollHeight - clientHeight));

    const newColumnPosition = this._getIncrementedPosition(
          this.state.columnPosition,
          calculatedScrollLeft - this._lastScrollLeft,
          columnTracker, viewWidth);
    const newRowPosition = this._getIncrementedPosition(
          this.state.rowPosition,
          calculatedScrollTop - this._lastScrollTop,
          rowTracker, viewHeight);

    const needRender = this._isRenderNeeded({
      calculatedScrollLeft,
      calculatedScrollTop,
      columnTracker,
      newColumnPosition,
      newRowPosition,
      rowTracker,
      scrollLeft,
      scrollTop,
      viewHeight,
      viewWidth,
    });
    if (!needRender) {
      this._lastScrollTop = scrollTop;
      this._lastScrollLeft = scrollLeft;
      this.state.columnPosition.updateFrom(newColumnPosition);
      this.state.rowPosition.updateFrom(newRowPosition);
    } else {
      this.setState((prevState: State): SetState => {
        return {
          isScrolling: true,
          columnPosition: newColumnPosition,
          rowPosition: newRowPosition,
          //scrollUpdateWasRequested: false,
        };
      }, this._resetIsScrollingDebounced);
    }
  }

  _isRenderNeeded(
    {
      calculatedScrollLeft,
      calculatedScrollTop,
      columnTracker,
      newColumnPosition,
      newRowPosition,
      rowTracker,
      scrollLeft,
      scrollTop,
      viewHeight,
      viewWidth,
    }: {
      calculatedScrollLeft: number,
      calculatedScrollTop: number,
      columnTracker: PositionTracker,
      newColumnPosition: ScrollPosition,
      newRowPosition: ScrollPosition,
      rowTracker: PositionTracker,
      scrollLeft: number,
      scrollTop: number,
      viewHeight: number,
      viewWidth: number,
    }
  ): boolean {
    let isNeeded = true;
    const newViewTop = Math.trunc(newRowPosition.getViewStartOffset(
          rowTracker, viewHeight));
    const newViewLeft = Math.trunc(newColumnPosition.getViewStartOffset(
          columnTracker, viewWidth));
    const renderedRowStartOffset = rowTracker.getItemStats(
          this._renderedRowRange.start).start;
    const renderedRowEndOffset = rowTracker.getItemStats(
          this._renderedRowRange.end).end;
    const newViewBottom = newViewTop + viewHeight;
    const newViewRight = newViewLeft + viewWidth;
    if (renderedRowStartOffset <= newViewTop &&
          renderedRowEndOffset >= newViewBottom) {
      isNeeded = false;
    }
    return isNeeded;
  }

  _resetIsScrolling = () => {
    this._resetIsScrollingTimeoutId = null;
    this.setState({ isScrolling: false });
  }

  _resetIsScrollingDebounced = () => {
    if (this._resetIsScrollingTimeoutId !== null) {
      cancelTimeout(this._resetIsScrollingTimeoutId);
    }

    this._resetIsScrollingTimeoutId = requestTimeout(
      this._resetIsScrolling,
      IS_SCROLLING_DEBOUNCE_INTERVAL
    );
  };

}

