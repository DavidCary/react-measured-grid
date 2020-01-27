// @flow

// Copyright (c) 2020, David Cary, MIT License

export const DBG = 5;
export function PDBG(msg: mixed) {
  console.debug(elapsed()+': '+String(msg));
}
export const DBGPS = 3;
export const DBGPS_DEPTH = 1;
export const DBG_NO_DIDX = false; //To inspect interim DOM
export const DBG_SHOW_JSON = false;

export function isArray(value: mixed): boolean %checks {
  return typeof value === 'object' && Array.isArray(value);
}

export function isFiniteNumber(value: mixed): boolean %checks {
  return typeof value === 'number' && isFinite(value);
}

export function isBetween(
      value: mixed, low: number, high: number = Infinity
      ): boolean %checks {
  return typeof value === 'number' && value >= low && value <= high;
}

export function isFiniteNumberBetween(
      value: mixed, low: number, high: number = Infinity
      ): boolean %checks {
  return typeof value === 'number' && isFinite(value) &&
        value >= low && value <= high;
}

const _startTime = Date.now();
export function elapsed(): string {
  const now = Date.now();
  const elapsedMs = now - _startTime;
  const result = (elapsedMs / 1000).toFixed(3);
  return result;
}

export function TS(msg: mixed): string {
  const result = elapsed()+': '+String(msg);
  return result;
}

export function show(value: mixed, maxDepth: number = 1): string {
  const result = maxDepth <= 0 ? '' : qdmShow(value, 0, maxDepth);
  return result;
}

export function showx(value: mixed, maxDepth: number = 1): string {
  return DBG_SHOW_JSON ? String(JSON.stringify(value)) : show(value, maxDepth);
}

function qdmShow(value: mixed, depth: number, maxDepth: number): string {
  let result = '';
  if (typeof value == 'string') {
    return '"' + value + '"';
  }
  if (typeof value == 'number') {
    return '' + value;
  }
  if (typeof value == 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value == 'undefined') {
    return '<undefined>';
  }
  if (value === null) {
    return '<null>';
  }
  if (typeof value == 'function') {
    return '<function>';
  }
  if (Array.isArray(value)) {
    if (maxDepth && depth === maxDepth) {
      return '<object>';
    }
    let items = []
    const value2: any = value;
    let prevIndex = -1;
    for (let index in value2) {
      index = Number(index);
      const increment = index - prevIndex;
      if (increment > 1) {
        items.push('<skip '+(increment - 1)+'>');
      }
      items.push(qdmShow(value2[index], depth + 1, maxDepth));
      prevIndex = index;
    }
    const result = '[' + items.join(', ') + ']';
    return result;
  }
  if (typeof value == 'object') {
    if (maxDepth && depth === maxDepth) {
      return '<object>';
    }
    let result = '{';
    let items = [];
    for (let key in value) {
      let item = qdmShow(key, depth + 1, maxDepth) + ': ' +
            qdmShow(value[key], depth + 1, maxDepth);
      items.push(item);
    }
    result = '{'+items.join(', ') + '}';
    return result;
  }
  result = '<unknown ' + (typeof value) + '>';
  return result;
}
  
type AnyObject = {[string]: any};
type Diff = {isEqual: boolean | null, only1: AnyObject, only2: AnyObject,
      valuesDiffer: {[string]: {value1: AnyObject, value2: AnyObject}}};

export function diffObjects(obj1: any, obj2: any): Diff {
  const result: Diff = {isEqual: true, only1: {}, only2: {}, valuesDiffer: {}};
  if (obj1 === null || typeof obj1 !== 'object' ||
        obj2 === null || typeof obj2 !== 'object') {
    result.isEqual = null;
    return result;
  }
  let key;
  for (key in obj1) {
    if (key in obj2) {
      if (obj1[key] !== obj2[key]) {
        result.valuesDiffer[key] = {value1: obj1[key], value2: obj2[key]};
        result.isEqual = false;
      }
    } else {
      result.only1[key] = obj1[key];
      result.isEqual = false;
    }
  }
  for (key in obj2) {
    if (!(key in obj1)) {
      result.only2[key] = obj2[key];
      result.isEqual = false;
    }
  }
  return result;
}

var qdmPrevProps: any = null;
var qdmPrevState: any = null;
function showDiff(diff: Diff): string {
  const result =
        diff.isEqual ? '' :
        '{isEqual: '+show(diff.isEqual)+
        (Object.keys(diff.only1).length ? ', only1: '+show(diff.only1, 1) : '')+
        (Object.keys(diff.only2).length ? ', only2: '+show(diff.only2, 1) : '')+
        (Object.keys(diff.valuesDiffer).length ?
          ', valuesDiffer: '+show(diff.valuesDiffer, 2) : '')+
        '}';
  return result;
}

export function showPropsCompare(props: any): string {
  const diff = diffObjects(props, qdmPrevProps);
  const result = showDiff(diff);
  qdmPrevProps = props;
  return result;
}
export function showStateCompare(state: any): string {
  const diff = diffObjects(state, qdmPrevState);
  const result = showDiff(diff);
  qdmPrevState = state;
  return result;
}
  

