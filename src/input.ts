import type { Facing, InputAction, InputRecord } from './types';

export interface PlayerInputConfig {
  left: string;
  right: string;
  up: string;
  down: string;
  lightPunch: string;
  heavyPunch: string;
}

const DIRECTIONS_4 = {
  neutral: 5,
  down: 2,
  up: 8,
  left: 4,
  right: 6,
  downLeft: 1,
  downRight: 3,
  upLeft: 7,
  upRight: 9
} as const;

export class InputManager {
  private pressedKeys = new Set<string>();
  private actionState = new Map<InputAction, boolean>();
  private prevActionState = new Map<InputAction, boolean>();
  private buffer: InputRecord[] = [];

  constructor(
    private readonly config: PlayerInputConfig,
    private readonly bufferSize = 30
  ) {
    Object.keys(config).forEach((action) => {
      this.actionState.set(action as InputAction, false);
      this.prevActionState.set(action as InputAction, false);
    });
  }

  public bind(): void {
    window.addEventListener('keydown', (e) => {
      this.pressedKeys.add(e.code);
      if (e.code === 'F1' || e.code === 'F2') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.code);
    });
  }

  public update(frame: number, facing: Facing): void {
    this.prevActionState = new Map(this.actionState);

    (Object.keys(this.config) as InputAction[]).forEach((action) => {
      const code = this.config[action];
      this.actionState.set(action, this.pressedKeys.has(code));
    });

    const dir = this.getDirectionNumber(facing);
    const buttons = ['lightPunch', 'heavyPunch'].filter((b) => this.getPressedThisFrame(b as InputAction));
    this.buffer.unshift({ frame, dir, buttons });
    this.buffer = this.buffer.slice(0, this.bufferSize);
  }

  public isDown(action: InputAction): boolean {
    return this.actionState.get(action) ?? false;
  }

  public getPressedThisFrame(action: InputAction): boolean {
    const now = this.actionState.get(action) ?? false;
    const prev = this.prevActionState.get(action) ?? false;
    return now && !prev;
  }

  public getRecentInputs(maxFrames = 20): InputRecord[] {
    return this.buffer.filter((r) => this.buffer[0].frame - r.frame <= maxFrames);
  }

  public hasMotion(sequence: string[], maxGap = 8): boolean {
    let lastIndex = -1;

    for (const expected of sequence) {
      let found = false;
      for (let i = lastIndex + 1; i < this.buffer.length; i += 1) {
        const rec = this.buffer[i];
        const prev = this.buffer[lastIndex];
        if (lastIndex >= 0 && prev.frame - rec.frame > maxGap) {
          return false;
        }

        if (this.matchToken(rec, expected)) {
          lastIndex = i;
          found = true;
          break;
        }
      }

      if (!found) {
        return false;
      }
    }

    return true;
  }

  private matchToken(rec: InputRecord, token: string): boolean {
    if (token === 'P') {
      return rec.buttons.includes('lightPunch') || rec.buttons.includes('heavyPunch');
    }
    return Number(token) === rec.dir;
  }

  private getDirectionNumber(facing: Facing): number {
    const left = this.isDown('left');
    const right = this.isDown('right');
    const up = this.isDown('up');
    const down = this.isDown('down');

    const forward = facing === 1 ? right : left;
    const back = facing === 1 ? left : right;

    if (down && back) return DIRECTIONS_4.downLeft;
    if (down && forward) return DIRECTIONS_4.downRight;
    if (up && back) return DIRECTIONS_4.upLeft;
    if (up && forward) return DIRECTIONS_4.upRight;
    if (down) return DIRECTIONS_4.down;
    if (up) return DIRECTIONS_4.up;
    if (back) return DIRECTIONS_4.left;
    if (forward) return DIRECTIONS_4.right;
    return DIRECTIONS_4.neutral;
  }
}
