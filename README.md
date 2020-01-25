# react-measured-grid-dev

> A smoother scrolling virtualized React grid with dynamically measured rows and columns.

[![NPM](https://img.shields.io/npm/v/react-measured-grid-dev.svg)](https://www.npmjs.com/package/react-measured-grid-dev) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

`react-measured-grid` can be a good tool to use when:

  - You want to display data in a tabular format with rows and columns.
  - The height of a row might not be known until after it is rendered by the browser,
      for example if the content of a cell consists of variable length text
      that can wrap to an unknown number of lines.
  - The number of rows can be very large, for example tens of thousands of rows.
  - The number of columns is not very large.
  - You want to support relatively smooth forward and backward scrolling.
  - You want the option to easily control column widths
      and the size of the view window
      with a combination of inline and selector-based CSS
      in units other than pixels.

## Demo

You can interact with a 
[demo](https://DavidCary.github.io/react-measured-grid/demo1/build)
to get an idea of the performance and flexibility this offers.

## Install

```bash
        # Yarn
        yarn add react-measured-grid

        # NPM
        npm install --save react-measured-grid
```

## Usage

If `dataArray` is an array of arrays of data, for example:

        dataArray = [
          ['gen-0157-C', 'Generator 157, model C; 120 volts, 500 Watts, with extended overload protection', 7],
          ['ptr-0049-F', 'Printer 49 in the F block', 1],
          ...
        ];

Then displaying three columns of data with a `MeasuredGrid` component
can be as simple as:

        <MeasuredGrid
          dataArrayInitial={dataArray}
          columnCountInitial={3}
          columnWidth={['15ex', '45ex', '8ex']}
          viewStyle={{width: 75ex, height: 20ex}}
        />
    
## API

You can read about the
[full API](https://DavidCary.github.io/react-measured-grid/)
for more details and options.

Additional features include:

  - Position a specified row at the top, middle, or bottom
      of the view window.
  - Support for efficiently adding rows to or removing rows from
      the end of the data.
  - Support for rows that dynamically change height
      and columns that change width.

## Background

`MeasuredGrid` displays virtualized data,
meaning that at any one time it will put in the DOM
only those rows in a neighborhood of the rows
that can be seen in the scrollable view window.

In contrast, if `MeasuredGrid` needs to add part of a row to the DOM,
it will add the entire row.

`react-measured-grid` was inspired by
[`react-virtualized`](https://npmjs.com/package/react-virtualized),
but is somewhat more directly a fork of
[`react-window`](https://npmjs.co/package/react-window).

`react-measured-grid` is designed
to provide smoother scrolling than `react-virtualized`,
especially smoother backwards scrolling over rows not previously rendered.
However `react-measured-grid` will typically be somewhat less efficient
in its virtualization than `react-window`,
which depends on knowing the height of rows
and widths of columns in pixels
before it decides how to populate the DOM.
The difference in efficiency will vary
depending on the number of columns and other patterns in the data
and on the extent to which you use features of `react-measured-grid`
to tune its performance.

While `react-measured-grid` borrowed many ideas from those packages,
it does not attempt to provide an API that is compatible with either one.

## License

MIT © 2020 [DavidCary](https://github.com/DavidCary)

 
