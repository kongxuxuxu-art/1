import type { CharacterDef } from '../types';

export const hero: CharacterDef = {
  id: 'hero',
  displayName: 'Prototype Hero',
  walkSpeed: 3.6,
  jumpSpeed: 13,
  gravity: 0.7,
  maxHp: 1000,
  pushbox: { x: -20, y: -90, w: 40, h: 90 },
  hurtboxStanding: { x: -22, y: -96, w: 44, h: 96 },
  hurtboxCrouching: { x: -24, y: -62, w: 48, h: 62 },
  moves: {
    fiveLP: {
      name: '5LP',
      startup: 3,
      active: 2,
      recovery: 7,
      totalFrames: 12,
      damage: 45,
      hitstun: 10,
      knockbackX: 1.4,
      knockbackY: 0,
      cancelWindow: [4, 8],
      input: ['P'],
      hitboxes: [{ frame: 3, box: { x: 14, y: -72, w: 30, h: 16 } }, { frame: 4, box: { x: 14, y: -72, w: 30, h: 16 } }]
    },
    fiveHP: {
      name: '5HP',
      startup: 7,
      active: 3,
      recovery: 14,
      totalFrames: 24,
      damage: 85,
      hitstun: 15,
      knockbackX: 2.2,
      knockbackY: 0,
      cancelWindow: null,
      input: ['heavyPunch'],
      hitboxes: [
        { frame: 7, box: { x: 18, y: -78, w: 40, h: 18 } },
        { frame: 8, box: { x: 22, y: -78, w: 40, h: 18 } },
        { frame: 9, box: { x: 22, y: -78, w: 40, h: 18 } }
      ]
    },
    twoLP: {
      name: '2LP',
      startup: 4,
      active: 2,
      recovery: 8,
      totalFrames: 14,
      damage: 40,
      hitstun: 11,
      knockbackX: 1.2,
      knockbackY: 0,
      cancelWindow: [5, 9],
      input: ['2', 'P'],
      hitboxes: [
        { frame: 4, box: { x: 16, y: -42, w: 34, h: 14 } },
        { frame: 5, box: { x: 16, y: -42, w: 34, h: 14 } }
      ]
    },
    jLP: {
      name: 'jLP',
      startup: 3,
      active: 4,
      recovery: 8,
      totalFrames: 15,
      damage: 55,
      hitstun: 12,
      knockbackX: 1,
      knockbackY: -1.8,
      cancelWindow: null,
      input: ['8', 'P'],
      hitboxes: [
        { frame: 3, box: { x: 10, y: -58, w: 32, h: 16 } },
        { frame: 4, box: { x: 10, y: -58, w: 32, h: 16 } },
        { frame: 5, box: { x: 10, y: -58, w: 32, h: 16 } },
        { frame: 6, box: { x: 10, y: -58, w: 32, h: 16 } }
      ]
    },
    hadoken: {
      name: 'QCF+LP',
      startup: 9,
      active: 4,
      recovery: 18,
      totalFrames: 31,
      damage: 120,
      hitstun: 20,
      knockbackX: 2.8,
      knockbackY: -0.5,
      cancelWindow: null,
      input: ['2', '3', '6', 'P'],
      hitboxes: [
        { frame: 10, box: { x: 18, y: -68, w: 46, h: 24 } },
        { frame: 11, box: { x: 24, y: -68, w: 46, h: 24 } },
        { frame: 12, box: { x: 24, y: -68, w: 46, h: 24 } },
        { frame: 13, box: { x: 24, y: -68, w: 46, h: 24 } }
      ]
    }
  }
};
