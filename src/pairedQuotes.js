// @flow

// Copyright (c) 2020, David Cary, MIT License

import quotes from './quotes';
import type { QuoteItem } from './quotes';

function pickOneInWindow(
  items: QuoteItem[],
  windowBase: number,
  windowLength: number,
  shiftBy: number,
  pickState: number
): [QuoteItem, number, number] {
  const offset = Math.round(Math.abs(pickState)) % windowLength;
  const choiceIndex = (windowBase + offset) % items.length;
  const chosen = items[choiceIndex];
  items[choiceIndex] = items[windowBase];
  items[windowBase] = chosen;
  const newWindowBase = (windowBase + shiftBy) % items.length;
  return [chosen, newWindowBase, choiceIndex];
}

export type PairedQuote = [number, string, string, string, string];

function getPairedQuotes(nbrRows: number): PairedQuote[] {
  const result = [];
  const quotesCopy: QuoteItem[] = quotes.concat([]);
  let windowBase = 0;
  const windowLength = Math.trunc((quotesCopy.length + 1) / 2);
  const shiftBy = 1;
  let item;
  let choiceIndex;
  let prstate = 59383;
  for (let seqNbr = 0; seqNbr < nbrRows; seqNbr++) {
    prstate = (prstate * 1067 +  21419) % 568178;
    [item, windowBase, choiceIndex]  = pickOneInWindow(quotesCopy, windowBase, windowLength, shiftBy, prstate >> 3);
    const index2 = (choiceIndex + windowLength) % quotesCopy.length;
    const item2 = quotesCopy[index2];
    result.push([seqNbr, String(item.attribution), String(item.quote),
          String(item2.attribution), String(item2.quote)]);
  }
  return result;
}

export default getPairedQuotes;


