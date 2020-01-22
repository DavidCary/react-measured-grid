
// @flow

import React from 'react';

import {show} from './utils.js';

class ErrBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.debug("In ErrorBoundary: error="+show(error));
    console.debug("In ErrorBoundary: info="+show(info));
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <p>Something went wrong.</p>;
    }
    return this.props.children; 
  }
}

export default ErrBoundary;
