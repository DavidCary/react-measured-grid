
// @flow

import React from 'react';

import {show} from './utils.js';

class ErrBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): {hasError: boolean} {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.debug("In ErrorBoundary: error="+show(error));
    console.debug("In ErrorBoundary: info="+show(info));
  }

  render(): any {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <p>Something went wrong.</p>;
    }
    return this.props.children; 
  }
}

export default ErrBoundary;
