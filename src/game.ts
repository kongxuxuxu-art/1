import { InputManager, type PlayerInputConfig } from './input';
import { hero } from './data/hero';
import type { BoxOffset, Facing, FighterState, MoveDef, Rect } from './types';

const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 430;
const STAGE_LEFT = 40;
const STAGE_RIGHT = WIDTH - 40;
const FIXED_DT_MS = 1000 / 60;

interface Fighter {
  id: 'P1' | 'P2';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  hp: number;
  state: FighterState;
  stateFrame: number;
  attackFrame: number;
  currentMove: MoveDef | null;
  hitStop: number;
  hitstun: number;
  knockdown: number;
  grounded: boolean;
  color: string;
  input: InputManager;
  moveHitRegistry: Set<string>;
}

interface DebugState {
  showBoxes: boolean;
  showInput: boolean;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fighters: Fighter[];
  private frame = 0;
  private accumulator = 0;
  private lastTime = 0;
  private debug: DebugState = { showBoxes: false, showInput: false };

  constructor(root: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.className = 'game-canvas';

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas2D context unavailable');
    this.ctx = context;

    const p1Map: PlayerInputConfig = {
      left: 'KeyA',
      right: 'KeyD',
      up: 'KeyW',
      down: 'KeyS',
      lightPunch: 'KeyJ',
      heavyPunch: 'KeyK'
    };

    const p2Map: PlayerInputConfig = {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      up: 'ArrowUp',
      down: 'ArrowDown',
      lightPunch: 'Numpad1',
      heavyPunch: 'Numpad2'
    };

    const p1Input = new InputManager(p1Map, 40);
    const p2Input = new InputManager(p2Map, 40);
    p1Input.bind();
    p2Input.bind();

    this.fighters = [
      this.createFighter('P1', 260, 1, '#53e3a6', p1Input),
      this.createFighter('P2', 700, -1, '#ff7b8d', p2Input)
    ];

    const panel = document.createElement('div');
    panel.className = 'ui';
    panel.innerHTML = `
      <div class="title">发行级 Web 2D 格斗骨架（Vite + TS + Canvas2D）</div>
      <div class="hint">F1: 判定框/FPS, F2: 输入历史 | P1: WASD + J/K | P2: 方向键 + 小键盘1/2</div>
    `;

    root.append(panel, this.canvas);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F1') this.debug.showBoxes = !this.debug.showBoxes;
      if (e.code === 'F2') this.debug.showInput = !this.debug.showInput;
    });
  }

  public start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private loop = (now: number): void => {
    let delta = now - this.lastTime;
    if (delta > 100) delta = FIXED_DT_MS;
    this.lastTime = now;
    this.accumulator += delta;

    while (this.accumulator >= FIXED_DT_MS) {
      this.step();
      this.accumulator -= FIXED_DT_MS;
    }

    const alpha = this.accumulator / FIXED_DT_MS;
    this.render(alpha);
    requestAnimationFrame(this.loop);
  };

  private step(): void {
    this.frame += 1;
    const [p1, p2] = this.fighters;

    p1.facing = p1.x <= p2.x ? 1 : -1;
    p2.facing = (p1.facing * -1) as Facing;

    this.fighters.forEach((f) => f.input.update(this.frame, f.facing));
    this.fighters.forEach((f) => this.updateFighterState(f));

    this.resolvePushboxes(p1, p2);
    this.resolveHits(p1, p2);
    this.resolveHits(p2, p1);
  }

  private updateFighterState(f: Fighter): void {
    f.stateFrame += 1;

    if (f.hitStop > 0) {
      f.hitStop -= 1;
      return;
    }

    if (f.knockdown > 0) {
      f.knockdown -= 1;
      f.state = f.knockdown === 0 ? 'wakeup' : 'knockdown';
      return;
    }

    if (f.hitstun > 0) {
      f.hitstun -= 1;
      f.state = 'hitstun';
      this.applyPhysics(f);
      return;
    }

    if (f.currentMove) {
      this.stepAttack(f);
      this.applyPhysics(f);
      return;
    }

    const special = this.trySpecial(f);
    if (special) {
      this.startMove(f, special);
      return;
    }

    const normal = this.tryNormal(f);
    if (normal) {
      this.startMove(f, normal);
      return;
    }

    this.handleMovement(f);
    this.applyPhysics(f);
    this.updateMovementState(f);
  }

  private trySpecial(f: Fighter): MoveDef | null {
    if (!f.input.hasMotion(['2', '3', '6', 'P'], 8)) return null;
    if (!f.input.getPressedThisFrame('lightPunch')) return null;
    return hero.moves.hadoken;
  }

  private tryNormal(f: Fighter): MoveDef | null {
    if (f.input.getPressedThisFrame('heavyPunch')) return hero.moves.fiveHP;

    if (f.input.getPressedThisFrame('lightPunch')) {
      if (!f.grounded) return hero.moves.jLP;
      if (f.input.isDown('down')) return hero.moves.twoLP;
      return hero.moves.fiveLP;
    }

    return null;
  }

  private startMove(f: Fighter, move: MoveDef): void {
    f.currentMove = move;
    f.attackFrame = 0;
    f.state = 'attacking';
    f.stateFrame = 0;
    f.moveHitRegistry.clear();
  }

  private stepAttack(f: Fighter): void {
    const move = f.currentMove;
    if (!move) return;

    f.attackFrame += 1;

    if (f.attackFrame >= move.totalFrames) {
      f.currentMove = null;
      f.attackFrame = 0;
      return;
    }
  }

  private handleMovement(f: Fighter): void {
    const forward = f.facing === 1 ? 'right' : 'left';
    const back = f.facing === 1 ? 'left' : 'right';

    f.vx = 0;
    if (f.input.isDown(forward)) f.vx += hero.walkSpeed;
    if (f.input.isDown(back)) f.vx -= hero.walkSpeed;

    if (f.grounded && f.input.getPressedThisFrame('up')) {
      f.vy = -hero.jumpSpeed;
      f.grounded = false;
      f.state = 'jump';
      f.stateFrame = 0;
    }
  }

  private applyPhysics(f: Fighter): void {
    if (!f.grounded) {
      f.vy += hero.gravity;
    }

    f.x += f.vx;
    f.y += f.vy;

    if (f.x < STAGE_LEFT) f.x = STAGE_LEFT;
    if (f.x > STAGE_RIGHT) f.x = STAGE_RIGHT;

    if (f.y >= GROUND_Y) {
      if (!f.grounded) {
        f.state = 'landing';
        f.stateFrame = 0;
      }
      f.y = GROUND_Y;
      f.vy = 0;
      f.grounded = true;
    }
  }

  private updateMovementState(f: Fighter): void {
    if (!f.grounded) {
      f.state = 'jump';
      return;
    }

    if (f.state === 'landing' && f.stateFrame < 3) return;

    if (f.input.isDown('down')) {
      f.state = 'crouch';
      return;
    }

    if (Math.abs(f.vx) > 0.1) {
      f.state = 'walk';
      return;
    }

    f.state = 'idle';
  }

  private resolvePushboxes(a: Fighter, b: Fighter): void {
    const ra = this.worldBox(a, hero.pushbox);
    const rb = this.worldBox(b, hero.pushbox);
    if (!this.overlap(ra, rb)) return;

    const centerDelta = (ra.x + ra.w * 0.5) - (rb.x + rb.w * 0.5);
    const direction = centerDelta >= 0 ? 1 : -1;
    const penetration = Math.min(ra.x + ra.w - rb.x, rb.x + rb.w - ra.x);
    const half = penetration * 0.5 + 0.01;

    a.x += half * direction;
    b.x -= half * direction;

    if (a.x < STAGE_LEFT) a.x = STAGE_LEFT;
    if (a.x > STAGE_RIGHT) a.x = STAGE_RIGHT;
    if (b.x < STAGE_LEFT) b.x = STAGE_LEFT;
    if (b.x > STAGE_RIGHT) b.x = STAGE_RIGHT;
  }

  private resolveHits(attacker: Fighter, defender: Fighter): void {
    if (!attacker.currentMove) return;
    const move = attacker.currentMove;

    const hitFrame = move.hitboxes.find((h) => h.frame === attacker.attackFrame);
    if (!hitFrame) return;

    const attackBox = this.worldBox(attacker, hitFrame.box);
    const hurtTemplate = defender.state === 'crouch' ? hero.hurtboxCrouching : hero.hurtboxStanding;
    const hurtBox = this.worldBox(defender, hurtTemplate);

    const key = `${attacker.id}-${defender.id}-${attacker.attackFrame}`;
    if (attacker.moveHitRegistry.has(key)) return;

    if (this.overlap(attackBox, hurtBox)) {
      attacker.moveHitRegistry.add(key);
      defender.hp = Math.max(0, defender.hp - move.damage);
      defender.hitstun = move.hitstun;
      defender.vx = move.knockbackX * attacker.facing;
      defender.vy = move.knockbackY;
      defender.grounded = false;
      if (move.knockbackY < -1.2) {
        defender.knockdown = 30;
      }
      attacker.hitStop = 4;
      defender.hitStop = 4;
    }
  }

  private worldBox(f: Fighter, box: BoxOffset): Rect {
    const x = f.facing === 1 ? f.x + box.x : f.x - box.x - box.w;
    return {
      x,
      y: f.y + box.y,
      w: box.w,
      h: box.h
    };
  }

  private overlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private render(alpha: number): void {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.drawBackground();

    this.fighters.forEach((f) => this.drawFighter(f, alpha));
    this.drawHud();
    if (this.debug.showBoxes) {
      this.drawDebugBoxes();
      this.drawFps();
    }
    if (this.debug.showInput) this.drawInputHistory();
  }

  private drawBackground(): void {
    const g = this.ctx.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0, '#1d3256');
    g.addColorStop(0.64, '#324d74');
    g.addColorStop(0.65, '#53493a');
    g.addColorStop(1, '#2a241c');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, GROUND_Y + 1);
    this.ctx.lineTo(WIDTH, GROUND_Y + 1);
    this.ctx.stroke();
  }

  private drawFighter(f: Fighter, _alpha: number): void {
    this.ctx.save();
    this.ctx.translate(f.x, f.y);
    this.ctx.scale(f.facing, 1);

    this.ctx.fillStyle = f.color;
    this.ctx.fillRect(-18, -88, 36, 88);
    this.ctx.fillStyle = '#0f1a2a';
    this.ctx.fillRect(-15, -118, 30, 30);

    if (f.currentMove && f.attackFrame >= f.currentMove.startup && f.attackFrame < f.currentMove.startup + f.currentMove.active) {
      this.ctx.fillStyle = '#ffd369';
      this.ctx.fillRect(18, -70, 24, 12);
    }

    this.ctx.restore();
  }

  private drawHud(): void {
    const [p1, p2] = this.fighters;
    this.ctx.fillStyle = 'rgba(7, 12, 20, 0.8)';
    this.ctx.fillRect(0, 0, WIDTH, 52);

    this.drawHpBar(30, 16, 380, p1.hp / hero.maxHp, '#53e3a6');
    this.drawHpBar(WIDTH - 410, 16, 380, p2.hp / hero.maxHp, '#ff7b8d');

    this.ctx.fillStyle = '#e4edff';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(`P1 ${p1.state}`, 30, 46);
    this.ctx.fillText(`P2 ${p2.state}`, WIDTH - 140, 46);
  }

  private drawHpBar(x: number, y: number, w: number, ratio: number, color: string): void {
    this.ctx.fillStyle = '#14233b';
    this.ctx.fillRect(x, y, w, 20);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w * Math.max(0, ratio), 20);
    this.ctx.strokeStyle = '#4f6588';
    this.ctx.strokeRect(x, y, w, 20);
  }

  private drawDebugBoxes(): void {
    this.fighters.forEach((f) => {
      const push = this.worldBox(f, hero.pushbox);
      const hurt = this.worldBox(f, f.state === 'crouch' ? hero.hurtboxCrouching : hero.hurtboxStanding);
      this.strokeRect(push, '#f4f1bb');
      this.strokeRect(hurt, '#88d0ff');

      if (f.currentMove) {
        const hb = f.currentMove.hitboxes.find((h) => h.frame === f.attackFrame);
        if (hb) this.strokeRect(this.worldBox(f, hb.box), '#ff4d6d');
      }
    });
  }

  private strokeRect(r: Rect, color: string): void {
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(r.x, r.y, r.w, r.h);
  }

  private drawFps(): void {
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(440, 8, 80, 30);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('60 FPS', 452, 28);
  }

  private drawInputHistory(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(10, 60, 300, 170);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '13px monospace';
    this.ctx.fillText('P1 Input Buffer', 18, 80);

    const records = this.fighters[0].input.getRecentInputs(30).slice(0, 10);
    records.forEach((r, idx) => {
      this.ctx.fillText(`#${r.frame}: dir=${r.dir}, btn=${r.buttons.join('+') || '-'}`, 18, 102 + idx * 14);
    });
  }

  private createFighter(id: 'P1' | 'P2', x: number, facing: Facing, color: string, input: InputManager): Fighter {
    return {
      id,
      x,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing,
      hp: hero.maxHp,
      state: 'idle',
      stateFrame: 0,
      attackFrame: 0,
      currentMove: null,
      hitStop: 0,
      hitstun: 0,
      knockdown: 0,
      grounded: true,
      color,
      input,
      moveHitRegistry: new Set()
    };
  }
}
