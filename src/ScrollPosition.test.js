import PositionTracker from './PositionTracker.js';
import ScrollPosition from './ScrollPosition.js';

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

describe('ScrollPosition constructor', () => {
  test('default values', () => {
    const scrollPos = new ScrollPosition();
    expect(scrollPos).not.toBeNull();
    expect(scrollPos._index).toBe(0);
    expect(scrollPos._alignment).toBe('start');
    expect(scrollPos._offset).toBe(0);
  });
  test('with index=5', () => {
    const scrollPos = new ScrollPosition(5);
    expect(scrollPos).not.toBeNull();
    expect(scrollPos._index).toBe(5);
    expect(scrollPos._alignment).toBe('start');
    expect(scrollPos._offset).toBe(0);
  });
  test('with args (8, "end", 210)', () => {
    const scrollPos = new ScrollPosition(8, 'end', 210);
    expect(scrollPos).not.toBeNull();
    expect(scrollPos._index).toBe(8);
    expect(scrollPos._alignment).toBe('end');
    expect(scrollPos._offset).toBe(210);
  });
});
 
describe('ScrollPosition get<properties>', () => {
  test('get v1', () => {
    const scrollPos = new ScrollPosition(99);
    expect(scrollPos.getIndex()).toBe(99);
    expect(scrollPos.getAlignment()).toBe('start');
    expect(scrollPos.getAlignedOffset()).toBe(0);
  });
  test('get v2', () => {
    const scrollPos = new ScrollPosition(17, 'center', -88);
    expect(scrollPos.getIndex()).toBe(17);
    expect(scrollPos.getAlignment()).toBe('center');
    expect(scrollPos.getAlignedOffset()).toBe(-88);
  });
});
 
describe('ScrollPosition updateFrom()', () => {
  test('updateFrom()', () => {
    const source = new ScrollPosition(12, 'end', 33);
    const target = new ScrollPosition(5, 'start', -15);
    expect(target.getIndex()).toBe(5);
    expect(target.getAlignment()).toBe('start');
    expect(target.getAlignedOffset()).toBe(-15);
    target.updateFrom(source);
    expect(target.getIndex()).toBe(12);
    expect(target.getAlignment()).toBe('end');
    expect(target.getAlignedOffset()).toBe(33);
  });
});

describe('ScrollPosition copy()', () => {
  test('copy()', () => {
    const scrollPos = new ScrollPosition(12, 'end', 33);
    const scrollPosCopy = scrollPos.copy(scrollPos);
    expect(scrollPosCopy.getIndex()).toBe(12);
    expect(scrollPosCopy.getAlignment()).toBe('end');
    expect(scrollPosCopy.getAlignedOffset()).toBe(33);
  });
});

describe('ScrollPosition incrementOffset()', () => {
  test('incrementOffset()', () => {
    const scrollPos = new ScrollPosition(12, 'end', 33);
    const scrollPosCopy = scrollPos.incrementOffset(21);
    expect(scrollPosCopy.getIndex()).toBe(12);
    expect(scrollPosCopy.getAlignment()).toBe('end');
    expect(scrollPosCopy.getAlignedOffset()).toBe(54);
  });
});

describe('ScrollPosition getTotalOffset()', () => {
  test('getTotalOffset() v1', () => {
    const posTracker = new PositionTracker(20, 20);
    posTracker.setItemSize(15,500);
    expect((new ScrollPosition(12)).
          getTotalOffset(posTracker, 400)).toBe(240);
    expect((new ScrollPosition(12, 'center')).
          getTotalOffset(posTracker, 400)).toBe(250);
    expect((new ScrollPosition(12, 'end')).
          getTotalOffset(posTracker, 400)).toBe(260);
    expect((new ScrollPosition(15)).
          getTotalOffset(posTracker, 400)).toBe(300);
    expect((new ScrollPosition(15, 'center')).
          getTotalOffset(posTracker, 300)).toBe(450);
    expect((new ScrollPosition(15, 'center')).
          getTotalOffset(posTracker, 800)).toBe(550);
    expect((new ScrollPosition(15, 'end')).
          getTotalOffset(posTracker, 300)).toBe(800);
    expect((new ScrollPosition(15, 'end')).
          getTotalOffset(posTracker, 800)).toBe(800);
    expect((new ScrollPosition(16)).
          getTotalOffset(posTracker, 400)).toBe(800);
  });
  test('getTotalOffset() v2', () => {
    const posTracker = new PositionTracker(7, 20);
    posTracker.setItemSize(5,100);
    expect((new ScrollPosition(4)).
          getTotalOffset(posTracker, 400)).toBe(80);
    expect((new ScrollPosition(4, 'center')).
          getTotalOffset(posTracker, 400)).toBe(90);
    expect((new ScrollPosition(4, 'end')).
          getTotalOffset(posTracker, 400)).toBe(100);
    expect((new ScrollPosition(5)).
          getTotalOffset(posTracker, 400)).toBe(100);
    expect((new ScrollPosition(5, 'center')).
          getTotalOffset(posTracker, 60)).toBe(130);
    expect((new ScrollPosition(5, 'center')).
          getTotalOffset(posTracker, 300)).toBe(150);
    expect((new ScrollPosition(5, 'end')).
          getTotalOffset(posTracker, 60)).toBe(200);
    expect((new ScrollPosition(5, 'end')).
          getTotalOffset(posTracker, 300)).toBe(200);
    expect((new ScrollPosition(6)).
          getTotalOffset(posTracker, 400)).toBe(200);
  });
});

describe('ScrollPosition changeAlignment()', () => {
  test('changeAlignment() from start', () => {
    const posTracker = new PositionTracker(10, 20);
    const scrollPos = new ScrollPosition(6, 'start', 15); 
    const realigned01 = scrollPos.changeAlignment('start', posTracker, 400);
    expect(realigned01.getIndex()).toBe(6);
    expect(realigned01.getAlignment()).toBe('start');
    expect(realigned01.getAlignedOffset()).toBe(15);
    const realigned02 = scrollPos.changeAlignment('center', posTracker, 400);
    expect(realigned02.getIndex()).toBe(6);
    expect(realigned02.getAlignment()).toBe('center');
    expect(realigned02.getAlignedOffset()).toBe(205);
    const realigned03 = scrollPos.changeAlignment('end', posTracker, 400);
    expect(realigned03.getIndex()).toBe(6);
    expect(realigned03.getAlignment()).toBe('end');
    expect(realigned03.getAlignedOffset()).toBe(395);
  });
  test('changeAlignment() from center', () => {
    const posTracker = new PositionTracker(10, 20);
    const scrollPos = new ScrollPosition(6, 'center', 15); 
    const realigned01 = scrollPos.changeAlignment('start', posTracker, 400);
    expect(realigned01.getIndex()).toBe(6);
    expect(realigned01.getAlignment()).toBe('start');
    expect(realigned01.getAlignedOffset()).toBe(-175);
    const realigned02 = scrollPos.changeAlignment('center', posTracker, 400);
    expect(realigned02.getIndex()).toBe(6);
    expect(realigned02.getAlignment()).toBe('center');
    expect(realigned02.getAlignedOffset()).toBe(15);
    const realigned03 = scrollPos.changeAlignment('end', posTracker, 400);
    expect(realigned03.getIndex()).toBe(6);
    expect(realigned03.getAlignment()).toBe('end');
    expect(realigned03.getAlignedOffset()).toBe(205);
  });
  test('changeAlignment() from end', () => {
    const posTracker = new PositionTracker(10, 20);
    const scrollPos = new ScrollPosition(6, 'end', 15); 
    const realigned01 = scrollPos.changeAlignment('start', posTracker, 400);
    expect(realigned01.getIndex()).toBe(6);
    expect(realigned01.getAlignment()).toBe('start');
    expect(realigned01.getAlignedOffset()).toBe(-365);
    const realigned02 = scrollPos.changeAlignment('center', posTracker, 400);
    expect(realigned02.getIndex()).toBe(6);
    expect(realigned02.getAlignment()).toBe('center');
    expect(realigned02.getAlignedOffset()).toBe(-175);
    const realigned03 = scrollPos.changeAlignment('end', posTracker, 400);
    expect(realigned03.getIndex()).toBe(6);
    expect(realigned03.getAlignment()).toBe('end');
    expect(realigned03.getAlignedOffset()).toBe(15);
  });
});

describe('ScrollPosition withContainingIndex()', () => {
  test('withContainingIndex() v1', () => {
    const posTracker = new PositionTracker(20, 20);
    const container01 = (new ScrollPosition(8, 'start', 0)).
          withContainingIndex(posTracker, 400);
    expect(container01.getIndex()).toBe(8);
    expect(container01.getAlignment()).toBe('start');
    expect(container01.getAlignedOffset()).toBe(0);
    const container02 = (new ScrollPosition(8, 'start', -35)).
          withContainingIndex(posTracker, 400);
    expect(container02.getIndex()).toBe(6);
    expect(container02.getAlignment()).toBe('start');
    expect(container02.getAlignedOffset()).toBe(5);
    const container03 = (new ScrollPosition(8, 'center', 95)).
          withContainingIndex(posTracker, 400);
    expect(container03.getIndex()).toBe(13);
    expect(container03.getAlignment()).toBe('center');
    expect(container03.getAlignedOffset()).toBe(-5);
    const container04 = (new ScrollPosition(8, 'end', 45)).
          withContainingIndex(posTracker, 400);
    expect(container04.getIndex()).toBe(11);
    expect(container04.getAlignment()).toBe('end');
    expect(container04.getAlignedOffset()).toBe(-15);
  });
  test('withContainingIndex() on boundaries', () => {
    const posTracker = new PositionTracker(20, 20);
    const container01 = (new ScrollPosition(8, 'start', 0)).
          withContainingIndex(posTracker, 400);
    expect(container01.getIndex()).toBe(8);
    expect(container01.getAlignment()).toBe('start');
    expect(container01.getAlignedOffset()).toBe(0);
    const container02 = (new ScrollPosition(0, 'start', 0)).
          withContainingIndex(posTracker, 400);
    expect(container02.getIndex()).toBe(0);
    expect(container02.getAlignment()).toBe('start');
    expect(container02.getAlignedOffset()).toBe(0);
    const container03 = (new ScrollPosition(0, 'start', 0)).
          withContainingIndex(posTracker, 400);
    expect(container03.getIndex()).toBe(0);
    expect(container03.getAlignment()).toBe('start');
    expect(container03.getAlignedOffset()).toBe(0);
    const container04 = (new ScrollPosition(8, 'start', -40)).
          withContainingIndex(posTracker, 400);
    expect(container04.getIndex()).toBe(6);
    expect(container04.getAlignment()).toBe('start');
    expect(container04.getAlignedOffset()).toBe(0);
    const container05 = (new ScrollPosition(7, 'end', 0)).
          withContainingIndex(posTracker, 400);
    expect(container05.getIndex()).toBe(7);
    expect(container05.getAlignment()).toBe('end');
    expect(container05.getAlignedOffset()).toBe(0);
    const container06 = (new ScrollPosition(5, 'end', -60)).
          withContainingIndex(posTracker, 400);
    expect(container06.getIndex()).toBe(2);
    expect(container06.getAlignment()).toBe('end');
    expect(container06.getAlignedOffset()).toBe(0);
    const container07 = (new ScrollPosition(19, 'end', 0)).
          withContainingIndex(posTracker, 400);
    expect(container07.getIndex()).toBe(19);
    expect(container07.getAlignment()).toBe('end');
    expect(container07.getAlignedOffset()).toBe(0);
    const container08 = (new ScrollPosition(15, 'center', 10)).
          withContainingIndex(posTracker, 400);
    expect(container08.getIndex()).toBe(15);
    expect(container08.getAlignment()).toBe('center');
    expect(container08.getAlignedOffset()).toBe(10);
    const container09 = (new ScrollPosition(15, 'center', 30)).
          withContainingIndex(posTracker, 400);
    expect(container09.getIndex()).toBe(16);
    expect(container09.getAlignment()).toBe('center');
    expect(container09.getAlignedOffset()).toBe(10);
    const container10 = (new ScrollPosition(15, 'center', -50)).
          withContainingIndex(posTracker, 400);
    expect(container10.getIndex()).toBe(13);
    expect(container10.getAlignment()).toBe('center');
    expect(container10.getAlignedOffset()).toBe(-10);
  });
  test('withContainingIndex() beyond grid', () => {
    const posTracker = new PositionTracker(20, 20);
    const container01 = (new ScrollPosition(3, 'start', -100)).
          withContainingIndex(posTracker, 400);
    expect(container01.getIndex()).toBe(0);
    expect(container01.getAlignment()).toBe('start');
    expect(container01.getAlignedOffset()).toBe(0);
    const container02 = (new ScrollPosition(3, 'center', -100)).
          withContainingIndex(posTracker, 400);
    expect(container02.getIndex()).toBe(0);
    expect(container02.getAlignment()).toBe('start');
    expect(container02.getAlignedOffset()).toBe(0);
    const container03 = (new ScrollPosition(3, 'end', -100)).
          withContainingIndex(posTracker, 400);
    expect(container03.getIndex()).toBe(0);
    expect(container03.getAlignment()).toBe('start');
    expect(container03.getAlignedOffset()).toBe(0);
    const container04 = (new ScrollPosition(18, 'start', 100)).
          withContainingIndex(posTracker, 400);
    expect(container04.getIndex()).toBe(19);
    expect(container04.getAlignment()).toBe('end');
    expect(container04.getAlignedOffset()).toBe(0);
    const container05 = (new ScrollPosition(18, 'center', 100)).
          withContainingIndex(posTracker, 400);
    expect(container05.getIndex()).toBe(19);
    expect(container05.getAlignment()).toBe('end');
    expect(container05.getAlignedOffset()).toBe(0);
    const container06 = (new ScrollPosition(18, 'end', 100)).
          withContainingIndex(posTracker, 400);
    expect(container06.getIndex()).toBe(19);
    expect(container06.getAlignment()).toBe('end');
    expect(container06.getAlignedOffset()).toBe(0);
    const container07 = (new ScrollPosition(20, 'end', 0)).
          withContainingIndex(posTracker, 400);
    expect(container07.getIndex()).toBe(19);
    expect(container07.getAlignment()).toBe('end');
    expect(container07.getAlignedOffset()).toBe(0);
    const container08 = (new ScrollPosition(-1, 'center', 0)).
          withContainingIndex(posTracker, 400);
    expect(container08.getIndex()).toBe(0);
    expect(container08.getAlignment()).toBe('center');
    expect(container08.getAlignedOffset()).toBe(0);
  });
});

describe('ScrollPosition getViewStartOffset()', () => {
  test('getViewStartOffset() v1', () => {
    const posTracker = new PositionTracker(100, 20);
    expect((new ScrollPosition(8, 'start', 0)).
          getViewStartOffset(posTracker, 400)).toBe(160);
    expect((new ScrollPosition(60, 'center', 35)).
          getViewStartOffset(posTracker, 400)).toBe(1045);
    expect((new ScrollPosition(60, 'end', 35)).
          getViewStartOffset(posTracker, 400)).toBe(855);
    expect((new ScrollPosition(10, 'end', 35)).
          getViewStartOffset(posTracker, 400)).toBe(0);
  });
});

