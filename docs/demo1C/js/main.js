function onLoad() {

  app = {};

  // DOM utilities
  app.getId = function (id) {
    id = String(id);
    const result = document.getElementById(id);
    if (!result) {
      throw ReferenceError('Error: no element found with id = "' + id + '".');
    }
    return result;
  };
  
  app.listen = function (element, type, listener) {
    element.addEventListener(type, listener);
  };
  
  app.hasClass = function (element, className) {
    className = String(className);
    const classNames = String(element.className).split(' ');
    const result = classNames.some(name => name === className);
    return result;
  };
  
  app.addClass = function (element, className) {
    className = String(className);
    var classNames = element.className;
    if (!app.hasClass(element, className)) {
      classNames += (classNames.length ? ' ' : '') + className;
    }
    element.className = classNames;
  };
  
  app.removeClass = function (element, className) {
    className = String(className);
    var classNames = element.className.split(' ');
    classNames = classNames.filter(name => name !== className && name !== '');
    element.className = classNames.join(' ');
  };
  
  app.createElement = function (tagName, id, classNames, attributes) {
    const newElement = document.createElement(tagName);
    if (id) {
      newElement.setAttribute('id', id);
    }
    if (classNames) {
      newElement.setAttribute('class', classNames);
    }
    if (attributes && typeof attributes == 'object') {
      for(let attributeName in attributes) {
        newElement.setAttribute(attributeName, attributes[attributeName]);
      }
    }
    return newElement;
  };
  
  app.createElementIn = function (parentElement, tagName, id, classNames, attributes) {
    const newElement = app.createElement(tagName, id, classNames, attributes);
    if (parentElement) {
      parentElement.appendChild(newElement);
    }
    return newElement;
  };

  // Set DOM functions
  app.setPage = function (app) {
    app.startTimer();
    app.addClass(app.getId('wait-timer'), 'wait-timer');
    setTimeout(() => {
      app.setQuoteWidthStyle(app);
      app.setGrid(app);
      app.positionAt();
    }, 5);
  };

  app.setQuoteWidthStyle = function (app) {
    app.getId('quote-width-style').textContent = '.col-quote.set1 { width: '+app.state.quoteExWidth+'ex;}';
    app.state.quoteExWidthUsed = app.state.quoteExWidth;
  };

  app.displayTimerMessage = function () {
    var timerMessage = 'Building the grid took ' + app.getTimerStr() + ' seconds.';
    app.removeClass(app.getId('wait-timer'), 'wait-timer');
    if (app.state.message == 'ok') {
      app.state.message = timerMessage;
      var elm = app.getId('quote-grid-message');
      elm.innerText = app.state.message;
      elm.style.backgroundColor = "";
      elm.style.visibility = 'visible';
    }
    app.timeId = null;
  }    

  app.setGrid = function (app) {
    app.timerId = setTimeout(app.displayTimerMessage, 15);
    app.state.nbrRowsDisplayed = app.state.nbrRows;
    var pairedQuotes = app.getPairedQuotes(app.state.nbrRowsDisplayed);
    var gridBase = document.getElementById('grid-base');
    while (gridBase.firstChild) {
      gridBase.removeChild(gridBase.lastChild);
    }
    var table = app.createElementIn(gridBase, 'table');
    gridBase.appendChild(table);
    var tbody = app.createElementIn(table, 'tbody');
    table.appendChild(tbody);
    for (var rix = 0; rix < pairedQuotes.length; rix++) {
      var trow = app.makeTableRow(tbody, pairedQuotes, app, rix);
      tbody.appendChild(trow);
    }
  };

  app.makeTableRow = function (parentElm, pairedQuotes, app, rix) {
    var quoteRow = pairedQuotes[rix];
    var rowClass = 'grid-row ' + (rix % 2 ? 'odd' : 'even');
    var rowAttrs = {};
    rowAttrs.rowidex = rix;
    rowAttrs.datakey = "(row:"+rix+")";
    rowAttrs.style = 'box-sizing: border-box;';

    var rowElm = app.createElementIn(parentElm, 'tr', null, rowClass, rowAttrs);
    var colSeq = app.createElementIn(rowElm, 'td', null, 'grid-cell col-seq',
          {columnindex: "0", datakey: "(0:"+rix+")", style: "box-sizing: border-box;"});
    app.createElementIn(colSeq, 'div').innerText = String(rix);
    var colAttr1 = app.createElementIn(rowElm, 'td', null, 'grid-cell col-attribution set1',
          {columnindex: "1", datakey: "(1:"+rix+")", style: "box-sizing: border-box;"});
    app.createElementIn(colAttr1, 'div').innerText = String(quoteRow[1]);
    var colQuote1 = app.createElementIn(rowElm, 'td', null, 'grid-cell col-quote set1',
          {columnindex: "2", datakey: "(2:"+rix+")", style: "box-sizing: border-box;"});
    app.createElementIn(colQuote1, 'div').innerText = String(quoteRow[2]);
    var colAttr2 = app.createElementIn(rowElm, 'td', null, 'grid-cell col-attribution set2',
          {columnindex: "3", datakey: "(3:"+rix+")", style: "box-sizing: border-box;"});
    app.createElementIn(colAttr2, 'div').innerText = String(quoteRow[3]);
    var colQuote2 = app.createElementIn(rowElm, 'td', null, 'grid-cell col-quote set2',
          {columnindex: "4", datakey: "(4:"+rix+")", style: "box-sizing: border-box;",
          width: "400px;"});
    app.createElementIn(colQuote2, 'div').innerText = String(quoteRow[4]);
    return rowElm;
  };
  
  // Quote Grid
  app.maxNbrRows = 137000;
  app.minQuoteExWidth = 10;
  app.maxQuoteExWidth = 2000;
  app.errorStyle = {backgroundColor: '#faa'}

  app.state = {};
  app.state.nbrRows = 501;
  app.state.NbrRowsDisplayed = -1;
  app.state.nbrRowsOK = true;
  app.state.quoteExWidth = 45;
  app.state.quoteExWidthUsed = -1;
  app.state.quoteExWidthOK = true;
  app.state.rowIndex = -1;
  app.state.rowIndexOK = true;
  app.state.alignment = 'end';
  app.state.alignmentOK = true;
  app.state.rowOffset = 0;
  app.state.rowOffsetOK = true;
  app.state.message = 'ok';
  app.timerId = null;

  app.setValues = function () {
    var elm = app.getId('nbr-rows')
    elm.value = app.state.nbrRows;
    elm.style.backgroundColor = app.state.nbrRowsOK ? "" : app.errorStyle.backgroundColor;

    elm = app.getId('quote-width')
    elm.value = app.state.quoteExWidth;
    elm.style.backgroundColor = app.state.quoteExWidthOK ? "" : app.errorStyle.backgroundColor;

    elm = app.getId('rows-index')
    elm.value = app.state.rowIndex;
    elm.style.backgroundColor = app.state.rowIndexOK ? "" : app.errorStyle.backgroundColor;

    elm = app.getId('alignment')
    elm.value = app.state.alignment;
    elm.style.backgroundColor = app.state.alignmentOK ? "" : app.errorStyle.backgroundColor;

    elm = app.getId('row-offset')
    elm.value = app.state.rowOffset;
    elm.style.backgroundColor = app.state.rowOffsetOK ? "" : app.errorStyle.backgroundColor;

    elm = app.getId('quote-grid-message');
    elm.innerText = app.state.message;
    elm.style.backgroundColor = "";
    elm.style.visibility = 'visible';
    if (app.state.message.substr(0,5).toUpperCase() === "ERROR") {
      elm.style.backgroundColor = app.errorStyle.backgroundColor;
    } else if (app.state.message === 'ok') {
      elm.style.visibility = 'hidden';
    }
  }

  app.validateNbrRows = function (nbrRows) {
    var testRow = document.getElementById('grid-base').firstChild.firstChild.children[15];
    var value = Number(nbrRows);
    var message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Number of Rows is not a number.';
    } else if (value < 0) {
      message = 'Error: Number of Rows is less than zero.';
    } else if (value > app.maxNbrRows) {
      message = `Error: Number of Rows is too big (> ${app.maxNbrRows}).`;
    } else if (!Number.isInteger(value)) {
      message = 'Error: Number of Rows is not an integer.';
    }
    const isValid = message === 'ok';
    return {nbrRows: value, message, nbrRowsOK: isValid};
  }
    
  app.validateQuoteExWidth = function (quoteExWidth) {
    const value = Number(quoteExWidth);
    var message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Quote Width is not a number.';
    } else if (value < app.minQuoteExWidth) {
      message = `Error: Quote Width is too small (< ${app.minQuoteExWidth})`;
    } else if (value > app.maxQuoteExWidth) {
      message = `Error: Quote Width is too big (> ${app.maxQuoteExWidth}).`;
    }
    const isValid = message === 'ok';
    return {quoteExWidth: value, message, quoteExWidthOK: isValid};
  }

  app.validateRowOffset = function (rowOffset) {
    const value = Number(rowOffset);
    var message = 'ok';
    const maxOffset = app.maxNbrRows * 20;
    if (isNaN(value)) {
      message = 'Error: Offset is not a number.';
    } else if (value < -app.maxOffset) {
      message = `Error: Offset is too small (< ${-app.maxOffset})`;
    } else if (value > maxOffset) {
      message = `Error: Offset is too big (> ${app.maxOffset}).`;
    }
    const isValid = message === 'ok';
    return {rowOffset: value, message, rowOffsetOK: isValid};
  }

  app.validateRowIndex = function (rowIndex) {
    const value = Number(rowIndex);
    var message = 'ok';
    if (isNaN(value)) {
      message = 'Error: Row Index is not a number.';
    } else if (value < -app.state.nbrRowsDisplayed) {
      message = `Error: Row Index is too small (< ${-app.state.nbrRowsDisplayed})`;
    } else if (value >= app.state.nbrRowsDisplayed) {
      message = `Error: Row Index is too big (>= ${app.state.nbrRowsDisplayed}).`;
    } else if (!Number.isInteger(value)) {
      message = 'Error: Row Index is not an integer.';
    }
    const isValid = message === 'ok';
    return {rowIndex: value, message, rowIndexOK: isValid};
  }
    

  app.dataResize = function () {
    var validation = app.validateNbrRows(app.state.nbrRows);
    var nbrRows = validation.nbrRows;
    var nbrRowsOK = validation.nbrRowsOK;
    var message1 = validation.message;
    validation = app.validateQuoteExWidth(app.state.quoteExWidth);
    var quoteExWidth= validation.quoteExWidth;
    var quoteExWidthOK = validation.quoteExWidthOK;
    var message2 = validation.message;
    var message = message1;
    if (!nbrRowsOK) {
      message = message1;
    } else if (!quoteExWidthOK) {
      message = message2;
    } else {
      app.state.nbrRows = nbrRows;
      app.state.nbrRowsOK = nbrRowsOK;
      app.state.quoteExWidth= quoteExWidth;
      app.state.quoteExWidthOK = quoteExWidthOK;
      app.state.message = message;
      if (app.state.quoteExWidthUsed !== app.state.quoteExWidth) {
        app.setQuoteWidthStyle(app);
      }
      app.startTimer();
      app.addClass(app.getId('wait-timer'), 'wait-timer');
      setTimeout(() => {
        if (app.state.nbrRowsDisplayed !== app.state.nbrRows) {
          app.setGrid(app);
        } else {
          app.removeClass(app.getId('wait-timer'), 'wait-timer');
        }  
        app.setValues(); 
      }, 15);
    }
  }
  
  app.listen(app.getId('resize'), 'click', app.dataResize);

  app.positionAt = function () {
    var validation = app.validateRowIndex(app.state.rowIndex);
    var rowIndex = validation.rowIndex;
    var rowIndexOK = validation.rowIndexOK;
    var message1 = validation.message;
    validation = app.validateRowOffset(app.state.rowOffset);
    var rowOffset = validation.rowOffset;
    var rowOffsetOK = validation.rowOffsetOK;
    var message2 = validation.message;
    var alignment = app.state.alignment;
    var message = message1;
    if (!rowIndexOK) {
      message = message1;
    } else if (!rowOffsetOK) {
      message = message2;
    } else {
      app.state.rowIndex = rowIndex;
      app.state.rowIndexOK = rowIndexOK;
      app.state.rowOffset = rowOffset;
      app.state.rowOffsetOK = rowOffsetOK;
      app.state.message = message;
      app.setScrollPosition(rowIndex, alignment, rowOffset);
    }
    app.setValues(); 
  };

  app.setScrollPosition = function (rowIndex, alignment, rowOffset) {
    if (!isFinite(rowIndex) || !isFinite(rowOffset)) {
      return;
    }
    rowIndex = 0 + rowIndex;
    rowOffset = 0 + rowOffset;
    if (rowIndex < 0) {
      rowIndex = app.state.nbrRowsDisplayed + rowIndex;
    }
    var view = app.getId('quote-grid-view');
    var gridBase = view.firstElementChild;
    var tbody = gridBase.firstElementChild.firstElementChild;
    rowIndex = rowIndex < 0 ? tbody.children.length - rowIndex : rowIndex;
    rowIndex = Math.max(0, Math.min(rowIndex, tbody.children.length - 1));
    var row = tbody.children[rowIndex];
    if (row === undefined) {
      return;
    }
    var rowHeight = row.offsetHeight;
    var rowTop = row.offsetTop;
    var viewScrollTop = view.scrollTop;
    var viewClientHeight = view.clientHeight;
    var newScrollTop = rowTop;
    var scrollAdjust = 0;
    if (alignment == 'center') {
      scrollAdjust = -Math.max(0, Math.round((viewClientHeight - rowHeight)/2));
    }
    if (alignment == 'end') {
      scrollAdjust = -(viewClientHeight - rowHeight);
    }
    newScrollTop += scrollAdjust + rowOffset;
    newScrollTop = Math.max(0, Math.min(newScrollTop, view.scrollTopMax));    
    view.scrollTop = newScrollTop;
  };

  app.listen(app.getId('position-at'), 'click', app.positionAt);

  app.onChangeNbrRows = function (event) {
    var nbrRows = event.target.value;
    var validation = app.validateNbrRows(nbrRows);
    app.state.nbrRows = nbrRows;
    app.state.nbrRowsOK = validation.nbrRowsOK;
    app.state.message = validation.message;
    app.setValues(); 
  }

  app.listen(app.getId('nbr-rows'), 'change', app.onChangeNbrRows);
  app.listen(app.getId('nbr-rows'), 'input', app.onChangeNbrRows);

  app.onChangeQuoteExWidth = function (event) {
    var quoteExWidth = event.target.value;
    var validation = app.validateQuoteExWidth(quoteExWidth);
    app.state.quoteExWidth = quoteExWidth;
    app.state.quoteExWidthOK = validation.quoteExWidthOK;
    app.state.message = validation.message;
    app.setValues();
  }

  app.listen(app.getId('quote-width'), 'change', app.onChangeQuoteExWidth);
  app.listen(app.getId('quote-width'), 'input', app.onChangeQuoteExWidth);

  app.onChangeRowIndex = function (event) {
    var rowIndex = event.target.value;
    var validation = app.validateRowIndex(rowIndex);
    app.state.rowIndex = rowIndex;
    app.state.rowIndexOK = validation.rowIndexOK;
    app.state.message = validation.message;
    app.setValues();
  }

  app.listen(app.getId('rows-index'), 'change', app.onChangeRowIndex);
  app.listen(app.getId('rows-index'), 'input', app.onChangeRowIndex);

  app.onChangeAlignment = function (event) {
    app.state.message = 'ok';
    app.state.alignmentOK = true;
    app.state.alignment = event.target.value;
    app.setValues();
  }

  app.listen(app.getId('alignment'), 'change', app.onChangeAlignment);

  app.onChangeRowOffset = function (event) {
    var rowOffset = event.target.value;
    var validation = app.validateRowOffset(rowOffset);
    app.state.rowOffset = rowOffset;
    app.state.rowOffsetOK = validation.rowOffsetOK;
    app.state.message = validation.message;
    app.setValues();
  }

  app.listen(app.getId('row-offset'), 'change', app.onChangeRowOffset);
  app.listen(app.getId('row-offset'), 'input', app.onChangeRowOffset);


  // Paired Quotes
  app.pickOneInWindow = function (
    items,
    windowBase,
    windowLength,
    shiftBy,
    pickState
  ) {
    const offset = Math.round(Math.abs(pickState)) % windowLength;
    const choiceIndex = (windowBase + offset) % items.length;
    const chosen = items[choiceIndex];
    items[choiceIndex] = items[windowBase];
    items[windowBase] = chosen;
    const newWindowBase = (windowBase + shiftBy) % items.length;
    return [chosen, newWindowBase, choiceIndex];
  }
  
  app.getPairedQuotes = function (nbrRows) {
    const result = [];
    const quotesCopy = app.quotes.concat([]);
    var windowBase = 1 - 1;
    var windowLength = Math.trunc((quotesCopy.length + 1) / 2);
    var shiftBy = 1;
    var item;
    var choiceIndex;
    var prstate = 59383;
    for (let seqNbr = 0; seqNbr < nbrRows; seqNbr++) {
      prstate = (prstate * 1067 +  21419) % 568178;
      [item, windowBase, choiceIndex]  = app.pickOneInWindow(quotesCopy, windowBase,
            windowLength, shiftBy, prstate >> 3);
      const index2 = (choiceIndex + windowLength) % quotesCopy.length;
      const item2 = quotesCopy[index2];
      result.push([seqNbr, String(item.attribution), String(item.quote),
            String(item2.attribution), String(item2.quote)]);
    }
    return result;
  }
  
  
  // General Utilities
  app.startTimer = function () {
    app.timerStarted = Date.now();
  }
  
  app.getTimerMs = function () {
    const elapsedMs = Date.now() - app.timerStarted;
    return elapsedMs;
  }
  
  app.getTimerStr = function () {
    const result = (app.getTimerMs() / 1000).toFixed(2);
    return result; 
  }

  app._startTime = Date.now();
  app.elapsed = function () {
    const now = Date.now();
    const elapsedMs = now - app._startTime;
    const result = (elapsedMs / 1000).toFixed(3);
    return result;
  }
  

  // Quotes
  app.quotes = [
    {"attribution": "Maya Angelou", "quote": "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel."},
    {"attribution": "Will Rogers", "quote": "Good judgment comes from experience, and a lot of that comes from bad judgment."},
    {"attribution": "Swami Vivekananda", "quote": "Take up one idea. Make that one idea your life - think of it, dream of it, live on that idea. Let the brain, muscles, nerves, every part of your body, be full of that idea, and just leave every other idea alone. This is the way to success."},
    {"attribution": "Thomas Edison", "quote": "I failed my way to success."},
    {"attribution": "Alice Walker", "quote": "The most common way people give up their power is by thinking they don’t have any."},
    {"attribution": "George Washington", "quote": "It is far better to be alone, than to be in bad company."},
    {"attribution": "Thomas Jefferson", "quote": "My most earnest wish is to see the republican element of popular control pushed to the maximum of its practicable exercise. I shall then believe that our government may be pure and perpetual."},
    {"attribution": "Elizabeth I", "quote": "Words are leaves, the substance consists of deeds, which are the true fruits of a good tree."},
    {"attribution": "Lao Tzu", "quote": "The journey of a thousand miles begins with one step."},
    {"attribution": "Socrates", "quote": "An unexamined life is not worth living."},
    {"attribution": "George Clooney", "quote": "I had to stop going to auditions thinking, ‘Oh, I hope they like me.’ I had to go in thinking I was the answer to their problem."},
    {"attribution": "Madeleine L'Engle", "quote": "Because you're not what I would have you be / I blind myself to who, in truth, you are."},
    {"attribution": "Thomas Jefferson", "quote": "Honesty is the first chapter in the book of wisdom."},
    {"attribution": "John D. Rockefeller Jr.", "quote": "The secret of success is to do the common thing uncommonly well."},
    {"attribution": "Milton Berle", "quote": "If opportunity doesn't knock, build a door."},
    {"attribution": "Napoleon", "quote": "Never ascribe to malice, that which can be explained by incompetence."},
    {"attribution": "Augustine of Hippo", "quote": "The world is a book, and those who do not travel read only a page"},
    {"attribution": "Steve Jobs", "quote": "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma -- which is living with the results of other people's thinking."},
    {"attribution": "Harry S. Truman", "quote": "If you can’t convince them, confuse them."},
    {"attribution": "Margaret Mead", "quote": "Always remember that you are absolutely unique. Just like everyone else."},
    {"attribution": "Gertrude Atherton", "quote": "The human mind has an infinite capacity for self-deception."},
    {"attribution": "Thomas Jefferson", "quote": "I find that the harder I work, the more luck I seem to have."},
    {"attribution": "Zig Ziglar", "quote": "Don't be distracted by criticism. Remember -- the only taste of success some people get is to take a bite out of you."},
    {"attribution": "Rainer Maria Rilke", "quote": "The only journey is the one within."},
    {"attribution": "Ernest Naville", "quote": "In a democratic government, the right of decision belongs to the majority, but the right of representation belongs to all."},
    {"attribution": "Helen Keller", "quote": "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart."},
    {"attribution": "Colin R. Davis", "quote": "The road to success and the road to failure are almost exactly the same."},
    {"attribution": "Benjamin Franklin", "quote": "Tell me and I forget. Teach me and I remember. Involve me and I learn."},
    {"attribution": "Blaise Pascal", "quote": "I have made this letter longer than usual because I lack the time to make it shorter."},
    {"attribution": "Buddha", "quote": "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment."},
    {"attribution": "Audrey Hepburn", "quote": "Nothing is impossible, the word itself says 'I'm possible'!"},
    {"attribution": "Henry Ford", "quote": "When everything seems to be going against you, remember that the airplane takes off against the wind, not with it."},
    {"attribution": "Vincent van Gogh", "quote": "I would rather die of passion than of boredom."},
    {"attribution": "Rene Descartes", "quote": "I think, therefore, I am."},
    {"attribution": "Jesus Christ", "quote": "A new command I give you: Love one another. As I have loved you, so you must love one another."},
    {"attribution": "Aristotle", "quote": "It is during our darkest moments that we must focus to see the light."},
    {"attribution": "Henry David Thoreau", "quote": "Be true to your work, your word, and your friend."},
    {"attribution": "John Adams", "quote": "That it may be the interest of this assembly to do strict justice at all times, it should be an equal representation, or, in other words, equal interests among the people should have equal interests in it. Great care should be taken to effect this."},
    {"attribution": "Nelson Mandela", "quote": "The greatest glory in living lies not in never falling, but in rising every time we fall."},
    {"attribution": "Sondra Anice Barnes", "quote": "It's so hard when I have to, and so easy when I want to."},
    {"attribution": "Aristotle", "quote": "First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, materials, and methods. Third, adjust all your means to that end."},
    {"attribution": "Winston Churchill", "quote": "Success is walking from failure to failure with no loss of enthusiasm."},
    {"attribution": "Mae West", "quote": "You only live once, but if you do it right, once is enough."},
    {"attribution": "Leonora O'Reilly", "quote": "In the early days of our Republic the questions asked of each office seeker were, 'Is he honest? Is he capable? Is he faithful to the constitution?' In our present diseased state, the one question asked of an office seeker is, 'Is he faithful to the party?'"},
    {"attribution": "Franklin D. Roosevelt", "quote": "When you reach the end of your rope, tie a knot in it and hang on."},
    {"attribution": "James M. Barrie", "quote": "Life is a long lesson in humility."},
    {"attribution": "Ralph Waldo Emerson", "quote": "The only person you are destined to become is the person you decide to be."},
    {"attribution": "Euripides", "quote": "Friends show their love in times of trouble, not in happiness."},
    {"attribution": "Alexander Graham Bell", "quote": "Before anything else, preparation is the key to success."},
    {"attribution": "Dorothy Cottrell", "quote": "If you are going to do something that will annoy people, tell them about it afterwards; then they will only be annoyed that you have done it, and won't have all the exasperation of trying to stop you."},
    {"attribution": "Marcel Proust", "quote": "The real voyage of discovery consists not in seeking new lands but seeing with new eyes."},
    {"attribution": "Lillian Smith", "quote": "All the movements in the world, all the laws, the drives, the edicts will never do what personal relationships can do and must do."},
    {"attribution": "Albert Einstein", "quote": "Insanity: doing the same thing over and over again and expecting different results"},
    {"attribution": "Edmund Burke", "quote": "The only thing necessary for the triumph of evil is for good men to do nothing."},
    {"attribution": "John F. Kennedy", "quote": "Too often we enjoy the comfort of opinion without the discomfort of thought."},
    {"attribution": "Ralph Waldo Emerson", "quote": "Do not go where the path may lead, go instead where there is no path and leave a trail."},
    {"attribution": "Elizabeth Gaskell", "quote": "I sometimes think there's two sides to the commandment; and that we may say, 'Let others do unto you, as you would do unto them,' for pride often prevents our giving others a great deal of pleasure, in not letting them be kind, when their hearts are longing to help ..."},
    {"attribution": "Margaret Thatcher", "quote": "It is exciting to have a real crisis on your hands, when you have spent half your political life dealing with humdrum issues like the environment."},
    {"attribution": "Hans Christian Andersen", "quote": "Life itself is the most wonderful fairy tale."},
    {"attribution": "Lao-Tze", "quote": "Watch your thoughts; they become words.\nWatch your words; they become actions.\nWatch your actions; they become habits.\nWatch your habits; they become character.\nWatch your character; it becomes your destiny."},
    {"attribution": "Mother Teresa", "quote": "Spread love everywhere you go. Let no one ever come to you without leaving happier."},
    {"attribution": "George Orwell", "quote": "Happiness can exist only in acceptance."},
    {"attribution": "Coco Chanel", "quote": "The most courageous act is still to think for yourself. Aloud."},
    {"attribution": "Walt Whitman", "quote": "Keep your face always toward the sunshine - and shadows will fall behind you."},
    {"attribution": "Selma Lagerlöf", "quote": "More die in flight than in battle."},
    {"attribution": "Kathleen T. Norris", "quote": "If ambition doesn't hurt you, you haven't got it."},
    {"attribution": "Marcel Proust", "quote": "Let us be grateful to people who make us happy, they are the charming gardeners who make our souls blossom."},
    {"attribution": "Sigmund Freud", "quote": "Being entirely honest with oneself is a good exercise."},
    {"attribution": "Socrates", "quote": "The only true wisdom is in knowing you know nothing."},
    {"attribution": "Johann Sebastian Bach", "quote": "Ceaseless work, analysis, reflection, writing much, endless self-correction, that is my secret"},
    {"attribution": "George Bernard Shaw", "quote": "Life isn't about finding yourself. Life is about creating yourself."},
    {"attribution": "Viktor E. Frankl", "quote": "When we are no longer able to change a situation - we are challenged to change ourselves."},
    {"attribution": "Aldous Huxley", "quote": "There is only one corner of the universe you can be certain of improving, and that's your own self."},
    {"attribution": "Francis of Assisi", "quote": "Lord, make me an instrument of thy peace. Where there is hatred, let me sow love."},
    {"attribution": "Leonardo da Vinci", "quote": "Learning never exhausts the mind."},
    {"attribution": "Theodore Roosevelt", "quote": "Believe you can and you're halfway there."},
    {"attribution": "George Sand", "quote": "There is only one happiness in this life, to love and be loved."},
    {"attribution": "William Shakespeare", "quote": "We know what we are, but know not what we may be."},
    {"attribution": "Fanny Fern", "quote": "Can anybody tell me why reporters, in making mention of lady speakers, always consider it to be necessary to report, fully and firstly, the dresses worn by them? When John Jones or Senator Rouser frees his mind in public, we are left in painful ignorance of the color and fit of his pants, coat, necktie and vest — and worse still, the shape of his boots. This seems to me a great omission."},
    {"attribution": "Soren Kierkegaard", "quote": "Life is not a problem to be solved, but a reality to be experienced."},
    {"attribution": "Carrie Chapman Catt", "quote": "To the wrongs that need resistance, / To the right that needs assistance, / To the future in the distance, / We give ourselves."},
    {"attribution": "Eleanor Roosevelt", "quote": "I can not believe that war is the best solution. No one won the last war, and no one will win the next war."},
    {"attribution": "Abigail Adams", "quote": "We have too many high sounding words, and too few actions that correspond with them."},
    {"attribution": "Baltasar Gracian", "quote": "A wise man gets more use from his enemies than a fool from his friends."},
    {"attribution": "Babe Ruth", "quote": "Never let the fear of striking out keep you from playing the game."},
    {"attribution": "Eleanor Roosevelt", "quote": "The future belongs to those who believe in the beauty of their dreams."},
    {"attribution": "Edith Wharton", "quote": "There are two ways of spreading light: to be the candle or the mirror that reflects it."},
    {"attribution": "Karl A. Menninger", "quote": "Love cures people - both the ones who give it and the ones who receive it."},
    {"attribution": "Ernest Hemingway", "quote": "But man is not made for defeat. A man can be destroyed but not defeated."},
    {"attribution": "Albert Einstein", "quote": "Life is like riding a bicycle. To keep your balance, you must keep moving"},
    {"attribution": "Jane Wagner", "quote": "All my life I've always wanted to be somebody. But I see now I should have been more specific."},
    {"attribution": "Thomas A. Edison", "quote": "I have not failed. I've just found 10,000 ways that won't work."},
    {"attribution": "J. R. R. Tolkien", "quote": "Not all those who wander are lost."},
    {"attribution": "Martin Luther King, Jr.", "quote": "Life's most persistent and urgent question is, 'What are you doing for others?'"},
    {"attribution": "Confucius", "quote": "Real knowledge is to know the extent of one’s ignorance"},
    {"attribution": "Rosa Parks", "quote": "Many whites, even white Southerners told me that even though it may have seemed like the blacks were being freed (by my actions) they felt more free and at ease themselves. They thought that my action didn't just free blacks but them, too."},
    {"attribution": "Joseph Campbell", "quote": "Find a place inside where there's joy, and the joy will burn out the pain."},
    {"attribution": "Maya Angelou", "quote": "Try to be a rainbow in someone's cloud."},
    {"attribution": "Colin Powell", "quote": "There are no secrets to success. It is the result of preparation, hard work, and learning from failure."},
    {"attribution": "Sun Tzu", "quote": "The supreme art of war is to subdue the enemy without fighting."},
    {"attribution": "Oscar Wilde", "quote": "Keep love in your heart. A life without it is like a sunless garden when the flowers are dead."},
    {"attribution": "John Keats", "quote": "I love you the more in that I believe you had liked me for my own sake and for nothing else."},
    {"attribution": "Indira Gandhi", "quote": "You cannot shake hands with a clenched fist."},
    {"attribution": "Henry David Thoreau", "quote": "It's not what you look at that matters, it's what you see."},
    {"attribution": "Niccolo Machiavelli", "quote": "It is better to be feared than loved, if you cannot be both."},
    {"attribution": "P.D. James", "quote": "A politician is required to listen to humbug, talk humbug, condone humbug. The most we can hope for is that we don't actually believe it."},
    {"attribution": "Nellie McClung", "quote": "Disturbers are never popular — nobody ever really loved an alarm clock in action, no matter how grateful he may have been afterwards for its kind services!"},
    {"attribution": "Shirley MacLaine", "quote": "To release others from the expectations we have of them is to really love them."},
    {"attribution": "Antoine de Saint-Exupéry", "quote": "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."},
    {"attribution": "Gandhi", "quote": "You must be the change you wish to see in the world."},
    {"attribution": "Ingrid Bergman", "quote": "A kiss is a lovely trick designed by nature to stop speech when words become superfluous."},
    {"attribution": "Plutarch", "quote": "What we achieve inwardly will change outer reality."},
    {"attribution": "Herman Melville", "quote": "It is better to fail in originality than to succeed in imitation."},
    {"attribution": "Rita Mae Brown", "quote": "I know that after all is said and done, more is said than done."},
    {"attribution": "Anne Frank", "quote": "How wonderful it is that nobody need wait a single moment before starting to improve the world."},
    {"attribution": "H. Jackson Brown, Jr.", "quote": "The best preparation for tomorrow is doing your best today."},
    {"attribution": "Aesop", "quote": "No act of kindness, no matter how small, is ever wasted."},
    {"attribution": "George Clooney", "quote": "You never really learn much from hearing yourself speak."},
    {"attribution": "Arlene Rankin", "quote": "The way in which we think of ourselves has everything to do with how our world see us and how we see ourselves successfully acknowledged by the world."},
    {"attribution": "Galileo Galilei", "quote": "You cannot teach a man anything; you can only help him find it within himself."},
    {"attribution": "Margaret Mead", "quote": "Never doubt that a small group of thoughtful, committed citizens can change the world; indeed, it's the only thing that ever has."},
    {"attribution": "Julius Caesar", "quote": "Experience is the teacher of all things."},
    {"attribution": "Nelson Mandela", "quote": "Education is the most powerful weapon which you can use to change the world."},
    {"attribution": "Satchel Paige", "quote": "Work like you don't need the money. Love like you've never been hurt. Dance like nobody's watching."},
    {"attribution": "Thomas Jefferson", "quote": "Honesty is the first chapter in the book of wisdom."},
    {"attribution": "Steve Jobs", "quote": "Stay hungry, stay foolish."},
    {"attribution": "New York City detective", "quote": "I’ve gone into hundreds of [fortune-teller’s parlors], and have been told thousands of things, but nobody ever told me I was a policewoman getting ready to arrest her."},
    {"attribution": "Confucius", "quote": "Everything has beauty, but not everyone sees it."},
    {"attribution": "Susan B. Anthony", "quote": "Independence is happiness."},
    {"attribution": "John Galsworthy", "quote": "Love has no age, no limit; and no death."},
    {"attribution": "George Eliot", "quote": "Our deeds still travel with us from afar, / And what we have been makes us what we are."},
    {"attribution": "Edward Everett Hale", "quote": "Coming together is a beginning; keeping together is progress; working together is success."},
    {"attribution": "Elizabeth Cady Stanton", "quote": "... the wrongs of society can be more deeply impressed on a large class of readers in the form of fiction than by essays, sermons, or the facts of science."},
    {"attribution": "Doris Stevens", "quote": "The Administration pinned its faith on jail — that institution of convenience to the oppressor when he is strong in power and his weapons are effective. When the oppressor miscalculates the strength of the oppressed, jail loses its convenience."},
    {"attribution": "John C. Maxwell", "quote": "A leader is one who knows the way, goes the way, and shows the way."},
    {"attribution": "Immanuel Kant", "quote": "Science is organized knowledge. Wisdom is organized life."},
    {"attribution": "Thomas Aquinas", "quote": "There is nothing on this earth more to be prized than true friendship."},
    {"attribution": "Voltaire", "quote": "Judge a man by his questions rather than his answers."},
    {"attribution": "Judy Garland", "quote": "For it was not into my ear you whispered, but into my heart. It was not my lips you kissed, but my soul."},
    {"attribution": "William Arthur Ward", "quote": "The pessimist complains about the wind; the optimist expects it to change; the realist adjusts the sails."},
    {"attribution": "Desmond Tutu", "quote": "You don't choose your family. They are God's gift to you, as you are to them."},
    {"attribution": "Laura Ingalls Wilder", "quote": "It does not so much matter what happens. It is what one does when it happens that really counts."},
    {"attribution": "Confucius", "quote": "Life is really simple, but we insist on making it complicated."},
    {"attribution": "Henry Ford", "quote": "Whether you think you can or you think you can't, you're right."},
  ];

  app.setPage(app);
  return app;
}
