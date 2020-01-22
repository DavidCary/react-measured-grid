// Copyright (c) 2020, David Cary, MIT License

import quotes from './quotes';

function pickOneInWindow(items, windowBase, windowLength, shiftBy, pickState) {
  const offset = Math.round(Math.abs(pickState)) % windowLength;
  const choiceIndex = (windowBase + offset) % items.length;
  const chosen = items[choiceIndex];
  items[choiceIndex] = items[windowBase];
  items[windowBase] = chosen;
  const newWindowBase = (windowBase + shiftBy) % items.length;
  return [chosen, newWindowBase, choiceIndex];
}

function getPairedQuotes(nbrRows) {
  const result = [];
  let quotesCopy = quotes.concat([]);
  let windowBase = 1 - 1;
  let windowLength = Math.trunc((quotesCopy.length + 1) / 2);
  let shiftBy = 1;
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


