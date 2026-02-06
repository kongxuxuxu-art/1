export type Facing = 1 | -1;

export type InputAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'lightPunch'
  | 'heavyPunch';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoxOffset {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HitboxFrame {
  frame: number;
  box: BoxOffset;
}

export interface MoveDef {
  name: string;
  startup: number;
  active: number;
  recovery: number;
  totalFrames: number;
  damage: number;
  hitstun: number;
  knockbackX: number;
  knockbackY: number;
  cancelWindow: [number, number] | null;
  input: string[];
  hitboxes: HitboxFrame[];
}

export interface CharacterDef {
  id: string;
  displayName: string;
  walkSpeed: number;
  jumpSpeed: number;
  gravity: number;
  maxHp: number;
  pushbox: BoxOffset;
  hurtboxStanding: BoxOffset;
  hurtboxCrouching: BoxOffset;
  moves: Record<string, MoveDef>;
}

export type FighterState =
  | 'idle'
  | 'walk'
  | 'crouch'
  | 'jump'
  | 'landing'
  | 'hitstun'
  | 'knockdown'
  | 'wakeup'
  | 'attacking';

export interface InputRecord {
  frame: number;
  dir: number;
  buttons: string[];
}
