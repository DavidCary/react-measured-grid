import PositionTracker from './PositionTracker.js';
import {_private} from './PositionTracker.js';
import {show} from './utils';

const {_Node} = _private;

function expectError(errorFunction, parm1, errorType, messageRegexp) {
  try {
    errorFunction(parm1);
    expect(true).toBe(false);
  }
  catch (exc) {
    expect(exc instanceof errorType).toBe(true);
    expect(exc.message).toMatch(messageRegexp);
    return exc;
  }
  return 'No Error';
}

type ActionType = number | 'clear';
type ActionRange = number | [number, number];
type Action = [ActionRange , ActionType];
function populate(positionTracker: PositionTracker, actions:array<Action>) {
  actions.forEach(([actionRange, actionType]) => {
    if (typeof actionRange === 'number') {
      actionRange = [actionRange, actionRange];
    }
    const [first, last] = actionRange;
    for (let index = first; index <= last; index++) {
      if (typeof actionType === 'number') {
        positionTracker.setItemSize(index, actionType);
      } else if (actionType === 'clear') {
        positionTracker.clearItemSize(index);
      } else {
        console.error('Error: In massPopulate, invalid actionType(='+
              show(actionType)+') starting at index='+first);
      }
    }
  });
}

describe('Node', () => {
  test('constructor branches', () => {
    const bNode = new _Node(7, 16);
    expect(bNode).not.toBeNull();
    expect(bNode.measuredSize).toBe(0);
    expect(bNode.unmeasuredCount).toBe(7);
    expect(bNode.children.length).toBe(16);
    expect(bNode.getTotalSize(40)).toBe(280);
  });
  test('constructor leaves', () => {
    const lNode = new _Node(17, 32);
    expect(lNode).not.toBeNull();
    expect(lNode.measuredSize).toBe(0);
    expect(lNode.unmeasuredCount).toBe(17);
    expect(lNode.children.length).toBe(32);
    expect(lNode.getTotalSize(50)).toBe(850);
  });
});


describe('PositionTracker constructor', () => {
  test('default values', () => {
    const pTracker = new PositionTracker();
    expect(pTracker).not.toBeNull();
    expect(pTracker._itemCount).toBe(0);
    expect(pTracker._unmeasuredSize).toBe(18);
    expect(pTracker._lowSize).toBe(12);
    expect(pTracker._maxBranches).toBe(32);
    expect(pTracker._maxLeafItems).toBe(32);
    expect(pTracker._rootNode).not.toBeNull();
    expect(pTracker._rootNode instanceof _Node).toBe(true);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(0);
    expect(pTracker._rootLevel).toBe(1);
    expect(pTracker._branchCapacities).toEqual([1, 32, 1024]);
    expect(pTracker.getTotalSize()).toBe(0);
  });
  test('with itemCount=3', () => {
    const pTracker = new PositionTracker(3);
    expect(pTracker).not.toBeNull();
    expect(pTracker._itemCount).toBe(3);
    expect(pTracker._unmeasuredSize).toBe(18);
    expect(pTracker._lowSize).toBe(12);
    expect(pTracker._maxBranches).toBe(32);
    expect(pTracker._maxLeafItems).toBe(32);
    expect(pTracker._rootNode).not.toBeNull();
    expect(pTracker._rootNode instanceof _Node).toBe(true);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(3);
    expect(pTracker._rootLevel).toBe(1);
    expect(pTracker._branchCapacities).toEqual([1, 32, 1024]);
  });
  test('with all args', () => {
    const pTracker = new PositionTracker(85, 23, 19, 3, 7);
    expect(pTracker).not.toBeNull();
    expect(pTracker._itemCount).toBe(85);
    expect(pTracker._unmeasuredSize).toBe(23);
    expect(pTracker._lowSize).toBe(19);
    expect(pTracker._maxBranches).toBe(3);
    expect(pTracker._maxLeafItems).toBe(7);
    expect(pTracker._rootNode).not.toBeNull();
    expect(pTracker._rootNode instanceof _Node).toBe(true);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(85);
    expect(pTracker._rootLevel).toBe(3);
    expect(pTracker._branchCapacities).toEqual([1, 7, 21, 63, 189]);
  });
});

describe('PositionTracker get', () => {
  test('basic get', () => {
    const pTracker = new PositionTracker(17, 10, 5);
    expect(pTracker).not.toBeNull();
    expect(pTracker.getItemCount()).toBe(17);
    expect(pTracker.getUnmeasuredSize()).toBe(10);
    expect(pTracker.getLowSize()).toBe(5);
    expect(pTracker.getMaxBranches()).toBe(32);
    expect(pTracker.getMaxLeafItems()).toBe(32);
    expect(pTracker._rootNode).not.toBeNull();
    expect(pTracker._rootNode instanceof _Node).toBe(true);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(17);
    expect(pTracker._rootNode.getTotalSize(pTracker.getUnmeasuredSize())).toBe(170);
    expect(pTracker.getTotalSize()).toBe(170);
  });
});

describe('PositionTracker get/setItemSize()', () => {
  test('get/setItemSize()', () => {
    const pTracker = new PositionTracker(103, 30, 13, 3, 7);
    expect(pTracker.getTotalSize()).toBe(3090);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(103);

    expect(pTracker.setItemSize(9, 100)).toBeNull();
    expect(pTracker._rootNode.unmeasuredCount).toBe(102);
    expect(pTracker._rootNode.measuredSize).toBe(100);
    expect(pTracker.getTotalSize()).toBe(3160);
    expect(pTracker.getItemMeasuredSize(9)).toBe(100);
    expect(pTracker.getItemMeasuredSize(8)).toBe(null);
    expect(pTracker.getItemSize(9)).toBe(100);
    expect(pTracker.getItemSize(8)).toBe(30);
    expect(pTracker.getItemLowSize(9)).toBe(100);
    expect(pTracker.getItemLowSize(8)).toBe(13);


    expect(pTracker.setItemSize(102, 150)).toBeNull();
    expect(pTracker._rootNode.unmeasuredCount).toBe(101);
    expect(pTracker._rootNode.measuredSize).toBe(250);
    expect(pTracker.getTotalSize()).toBe(3280);
    expect(pTracker.getItemMeasuredSize(102)).toBe(150);
    expect(pTracker.getItemSize(102)).toBe(150);
    expect(pTracker.getItemLowSize(102)).toBe(150);

    expect(pTracker.setItemSize(9, 80)).toBe(100);
    expect(pTracker._rootNode.unmeasuredCount).toBe(101);
    expect(pTracker._rootNode.measuredSize).toBe(230);
    expect(pTracker.getTotalSize()).toBe(3260);
    expect(pTracker.getItemMeasuredSize(9)).toBe(80);
    expect(pTracker.getItemSize(9)).toBe(80);
    expect(pTracker.getItemLowSize(9)).toBe(80);

    expect(pTracker.clearItemSize(102)).toBe(150);
    expect(pTracker._rootNode.unmeasuredCount).toBe(102);
    expect(pTracker._rootNode.measuredSize).toBe(80);
    expect(pTracker.getTotalSize()).toBe(3140);
    expect(pTracker.getItemMeasuredSize(102)).toBe(null);
    expect(pTracker.getItemSize(102)).toBe(30);
    expect(pTracker.getItemLowSize(102)).toBe(13);
    /**/
  });
});

describe('PositionTracker getItemStats()', () => {
  test('getItemStats()', () => {
    const pTracker = new PositionTracker(207, 30, 13, 4, 8);
    expect(pTracker.getTotalSize()).toBe(6210);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(207);

    expect(pTracker.setItemSize(9, 100)).toBeNull();
    expect(pTracker._rootNode.unmeasuredCount).toBe(206);
    expect(pTracker._rootNode.measuredSize).toBe(100);
    expect(pTracker.getTotalSize()).toBe(6280);
    expect(pTracker.getItemMeasuredSize(9)).toBe(100);
    expect(pTracker.getItemMeasuredSize(8)).toBe(null);
    expect(pTracker.getItemStats(9)).toEqual(
          {start: 270, size: 100, end: 370, isMeasured: true});
    expect(pTracker.getItemStats(10)).toEqual(
          {start: 370, size: 30, end: 400, isMeasured: false});

    expect(pTracker.setItemSize(102, 150)).toBeNull();
    expect(pTracker._rootNode.unmeasuredCount).toBe(205);
    expect(pTracker._rootNode.measuredSize).toBe(250);
    expect(pTracker.getTotalSize()).toBe(6400);
    expect(pTracker.getItemMeasuredSize(102)).toBe(150);
    expect(pTracker.getItemSize(102)).toBe(150);
    expect(pTracker.getItemStats(102)).toEqual(
          {start: 3130, size: 150, end: 3280, isMeasured: true});
    expect(pTracker.getItemStats(103)).toEqual(
          {start: 3280, size: 30, end: 3310, isMeasured: false});

    expect(pTracker.setItemSize(9, 80)).toBe(100);
    expect(pTracker._rootNode.unmeasuredCount).toBe(205);
    expect(pTracker._rootNode.measuredSize).toBe(230);
    expect(pTracker.getTotalSize()).toBe(6380);
    expect(pTracker.getItemSize(9)).toBe(80);
    expect(pTracker.getItemStats(9)).toEqual(
          {start: 270, size: 80, end: 350, isMeasured: true});
    expect(pTracker.getItemStats(10)).toEqual(
          {start: 350, size: 30, end: 380, isMeasured: false});

    expect(pTracker.clearItemSize(102)).toBe(150);
    expect(pTracker._rootNode.unmeasuredCount).toBe(206);
    expect(pTracker._rootNode.measuredSize).toBe(80);
    expect(pTracker.getTotalSize()).toBe(6260);
    expect(pTracker.getItemSize(102)).toBe(30);
    expect(pTracker.getItemStats(102)).toEqual(
          {start: 3110, size: 30, end: 3140, isMeasured: false});
    expect(pTracker.getItemStats(103)).toEqual(
          {start: 3140, size: 30, end: 3170, isMeasured: false});
  });
});

describe('PositionTracker set/clearItemSizes()', () => {
  const cases = [
    [1, [[3,5],40], 1530, 170],
    /**/
    [2, [[14,16],40], 1560, 530],
    [3, [[25,27],40], 1590, 890],
    [4, [[36,38],40], 1620, 1250],
    [5, [[47,49],40], 1650, 1610],
    [6, [[0,2],50], 1710, 100],
    [7, [[11,13],50], 1770, 520],
    [8, [[22,24],50], 1830, 940],
    [9, [[33,35],50], 1890, 1360],
    [10, [[44,46],50], 1950, 1780],
    [11, [[6,10],60], 2100, 510],
    [12, [[17,21],60], 2250, 1080],
    [13, [[28,32],60], 2400, 1650],
    [14, [[39,43],60], 2550, 2220],
    [15, [[20,25],'clear'], 2420, 1170],
    [16, [[26,49],'clear'], 1920, 1890],
    [17, [[0,19], 'clear'], 1500, 570],
    [18, [[30,34], 100], 1850, 1300],
    /**/
  ];
  //test.each(cases)(
  test('set/clearItemSize()', () => {
  cases.forEach(
    //'setItemSize() #%p populating with %p',
    ([actionCount, lastAction, totalSize, lastSetStart]) => {
      //console.debug('actionCount='+actionCount+' lastAction='+lastAction+
      //      ' totalSize='+totalSize+' lastSetStart='+lastSetStart);
      const pTracker = new PositionTracker(50, 30, 25, 3, 4);
      expect(pTracker.getTotalSize()).toBe(1500);
  
      const actions = cases.slice(0, actionCount)
            .map(actionSet => actionSet[1]);
      populate(pTracker, actions);
      expect(pTracker.getTotalSize()).toBe(totalSize);
      const itemSize = lastAction[1] === 'clear' ? 30 : lastAction[1];
      const isMeasured = lastAction[1] === 'clear' ? false : true;
      expect(pTracker.getItemStats(lastAction[0][1])).toEqual(
            {start: lastSetStart, size: itemSize,
            end: lastSetStart + itemSize, isMeasured});
    }
  );
  });
});

describe('PositionTracker setItemCount()', () => {
  test('itemCount: 0 -> 13 -> 0', () => {
    const pTracker = new PositionTracker(0, 30, 25, 3, 4);
    expect(pTracker.getTotalSize()).toBe(0);
    expect(pTracker._rootLevel).toBe(1);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(0);

    pTracker.setItemCount(13);
    expect(pTracker.getTotalSize()).toBe(390);
    expect(pTracker._rootLevel).toBe(2);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(13);

    pTracker.setItemCount(0);
    expect(pTracker.getTotalSize()).toBe(0);
    expect(pTracker._rootLevel).toBe(1);
    expect(pTracker._rootNode.measuredSize).toBe(0);
    expect(pTracker._rootNode.unmeasuredCount).toBe(0);
  });
  const casesToKMaxLeafItems = 4;
  const casesToKMaxBranches = 3;
  const casesToK = ((startK, endK) => {
    const result = [];
    let rootLevel = 1;
    let rootCapacity = casesToKMaxLeafItems * casesToKMaxBranches;
    for (let k = startK; k <= endK; k++) {
      if (k > rootCapacity) {
        rootLevel += 1;
        rootCapacity *= casesToKMaxBranches;
      }
      const testCase = [k, rootLevel, k * 30];
      //console.debug('casesToK : '+testCase.toString());
      result.push(testCase);
    }
    return result;
  })(0, 40);
      
  //test.each(casesToK)(
  test('setItemSize()', () => {
  casesToK.forEach(
    //'itemCount: 0 -> %p -> 0',
    ([itemCount, rootLevel, totalSize]) => {
      const pTracker = new PositionTracker(0, 30, 25,
            casesToKMaxBranches, casesToKMaxLeafItems);
      expect(pTracker.getTotalSize()).toBe(0);
      expect(pTracker._rootLevel).toBe(1);
      expect(pTracker._rootNode.measuredSize).toBe(0);
      expect(pTracker._rootNode.unmeasuredCount).toBe(0);

      pTracker.setItemCount(itemCount);
      expect(pTracker.getTotalSize()).toBe(totalSize);
      expect(pTracker._rootLevel).toBe(rootLevel);
      expect(pTracker._rootNode.measuredSize).toBe(0);
      expect(pTracker._rootNode.unmeasuredCount).toBe(itemCount);

      pTracker.setItemCount(0);
      expect(pTracker.getTotalSize()).toBe(0);
      expect(pTracker._rootLevel).toBe(1);
      expect(pTracker._rootNode.measuredSize).toBe(0);
      expect(pTracker._rootNode.unmeasuredCount).toBe(0);
    }
  );
  });
});

describe('PositionTracker getContainingIndex', () => {
  test('PT getContainingIndex #1', () => {
    const pTracker = new PositionTracker(142, 20, 15);
    expect(pTracker.getContainingIndex(10)).toBe(0);
    expect(pTracker.getContainingIndex(30)).toBe(1);
    expect(pTracker.getContainingIndex(210)).toBe(10);
    expect(pTracker.getItemStats(15)).toEqual(
          {start: 300, size: 20, end: 320, isMeasured: false});
  });
  test('PT getContainingIndex #2', () => {
    const pTracker = new PositionTracker(142, 20, 15);
    /**/
    expect(pTracker.getContainingIndex(10)).toBe(0);
    expect(pTracker.getContainingIndex(105)).toBe(5);
    expect(pTracker.getContainingIndex(210)).toBe(10);
    expect(pTracker.getContainingIndex(105)).toBe(5);
    /**/
    expect(pTracker.getContainingIndex(2010)).toBe(100);
    expect(pTracker.getContainingIndex(2830)).toBe(141);
    expect(pTracker.getContainingIndex(2810)).toBe(140);
    expect(pTracker.getItemStats(5)).toEqual(
          {start: 100, size: 20, end: 120, isMeasured: false});
    expect(pTracker.getItemStats(15)).toEqual(
          {start: 300, size: 20, end: 320, isMeasured: false});
    expect(pTracker.setItemSize(5, 120)).toBe(null);
    expect(pTracker.getContainingIndex(10)).toBe(0);
    expect(pTracker.getContainingIndex(105)).toBe(5);
    expect(pTracker.getContainingIndex(310)).toBe(10);
    expect(pTracker.getContainingIndex(105)).toBe(5);
    expect(pTracker.getContainingIndex(2110)).toBe(100);
    expect(pTracker.getContainingIndex(2930)).toBe(141);
    expect(pTracker.getContainingIndex(2910)).toBe(140);
    expect(pTracker.getItemStats(5)).toEqual(
          {start: 100, size: 120, end: 220, isMeasured: true});
    expect(pTracker.getItemStats(15)).toEqual(
          {start: 400, size: 20, end: 420, isMeasured: false});

  });
});

describe('PositionTracker bad scroll #1', () => {
  test('bad scroll #1', () => {
    // In PT constructor
    const pTracker = new PositionTracker(142, 20, 15);

    // In measureRows
    /**/
    expect(pTracker.getTotalSize()).toBe(2840);
    expect(pTracker.setItemSize(36, 50.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(37, 95.59999084472656)).toBe(null);
    expect(pTracker.setItemSize(38, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(39, 20.599990844726562)).toBe(null);
    expect(pTracker.setItemSize(40, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(41, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(42, 20.599990844726562)).toBe(null);
    expect(pTracker.setItemSize(43, 35.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(44, 50.59999084472656)).toBe(null);
    expect(pTracker.setItemSize(45, 95.60000610351562)).toBe(null);
    expect(pTracker.setItemSize(46, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(47, 20.599990844726562)).toBe(null);
    expect(pTracker.setItemSize(48, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(49, 20.599990844726562)).toBe(null);
    expect(pTracker.setItemSize(50, 20.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(51, 35.600006103515625)).toBe(null);
    expect(pTracker.setItemSize(52, 50.59999084472656)).toBe(null);
    expect(pTracker.setItemSize(53, 95.60000610351562)).toBe(null);
    expect(pTracker.setItemSize(54, 20.599990844726562)).toBe(null);
    expect(pTracker.getTotalSize()).toBe(3196.3999938964844);
    /**/

    // In onScroll
    /**/
    expect(pTracker.getTotalSize()).toBe(3196.3999938964844);
    expect(pTracker.getItemStats(37)).toEqual(
          {start: 770.6000061035156, size: 95.59999084472656, end: 866.1999969482422, isMeasured: true});
    expect(pTracker.getItemStats(37)).toEqual(
          {start: 770.6000061035156, size: 95.59999084472656, end: 866.1999969482422, isMeasured: true});
    expect(pTracker.getItemStats(37)).toEqual(
          {start: 770.6000061035156, size: 95.59999084472656, end: 866.1999969482422, isMeasured: true});
    expect(pTracker.getTotalSize()).toBe(3196.3999938964844);
    /**/
    // Diagnostic Results
    expect(pTracker.getContainingIndex(10)).toBe(0);
    expect(pTracker.getContainingIndex(30)).toBe(1);
    expect(pTracker.getContainingIndex(210)).toBe(10);
    // Corrected Results
    expect(pTracker.getContainingIndex(770.6000061035156)).toBe(37);
    // Bad Results      
    //expect(pTracker.getContainingIndex(770.6000061035156)).toBe(110);
    // Ok Results
    expect(pTracker.getItemStats(110)).toEqual(
          {start: 2556.3999938964844, size: 20, end: 2576.3999938964844, isMeasured: false});
  });
});

describe('PositionTracker bad scroll #2', () => {
  test('bad scroll #2', () => {
    const itemCount = 7;
    const heightUnmeasuredEst = 20;
    const heightMin = 15;
    const pTracker = new PositionTracker(
          itemCount, heightUnmeasuredEst, heightMin, 3, 3);

    expect(pTracker.setItemSize(1, 25)).toBe(null);
    expect(pTracker.setItemCount(12)).toBe(undefined);
  });
});

describe('PositionTracker bad scroll #3', () => {
  test('bad scroll #3', () => {
    const itemCount = 35;
    const heightUnmeasuredEst = 20;
    const heightMin = 15;
    const pTracker = new PositionTracker(
          itemCount, heightUnmeasuredEst, heightMin);

    expect(pTracker.getItemStats(34)).toEqual({"start": 680, "size": 20, "end": 700, "isMeasured": false});
    expect(pTracker.setItemSize(34, 30)).toBe(null);
    expect(pTracker.getItemStats(34)).toEqual({"start": 680, "size": 30, "end": 710, "isMeasured": true});
    expect(pTracker.getItemStats(35)).toEqual({"start": 710, "size": 0, "end": 710, "isMeasured": true});
  });
});

describe('PositionTracker bad scroll #4', () => {
  test('bad scroll #4', () => {
    const itemCount = 35;
    const heightUnmeasuredEst = 20;
    const heightMin = 15;
    const pTracker = new PositionTracker(
          itemCount, heightUnmeasuredEst, heightMin);

    expect(pTracker.getItemStats(34)).toEqual({"start": 680, "size": 20, "end": 700, "isMeasured": false});
    expect(pTracker.setItemSize(34, 30)).toBe(null);
    expect(pTracker.getItemStats(34)).toEqual({"start": 680, "size": 30, "end": 710, "isMeasured": true});
    expect(pTracker.setItemCount(65)).toBe(undefined);
    expect(pTracker.setItemSize(62, 30)).toBe(null);
    expect(pTracker.setItemSize(63, 30)).toBe(null);
    expect(pTracker.setItemSize(64, 30)).toBe(null);
    expect(pTracker.getItemStats(64)).toEqual({"start": 1310, "size": 30, "end": 1340, "isMeasured": true});
  });
});

