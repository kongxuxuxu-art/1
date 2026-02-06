# 发行级 Web(HTML) 2D 格斗游戏工程骨架

基于 **Vite + TypeScript + Canvas 2D**（不使用 Python / pygame / WebGL）的可发布项目骨架。

## 已实现能力（里程碑 1）

- 60 FPS 固定时间步主循环（`1000 / 60`），渲染阶段保留插值参数。
- 输入系统：
  - 可配置按键映射（每个玩家独立）。
  - 输入缓冲（默认 40 帧，覆盖“至少 8 帧”要求）。
  - 指令识别（示例：`↓↘→ + J` => `2,3,6,P`）。
- 战斗判定：
  - `Pushbox` / `Hurtbox` / `Hitbox` 三盒分离。
  - 稳定碰撞：每帧固定步推进 + 盒子分离与互斥推进。
- 帧数据驱动：
  - 招式数据在 `src/data/hero.ts`。
  - 字段包括：`startup/active/recovery/totalFrames/damage/knockback/hitstun/cancelWindow`。
- 角色状态机：
  - `idle / walk / crouch / jump / landing / hitstun / knockdown / wakeup / attacking`。
- 双人本地对战：
  - P1：`A/D/W/S + J/K`
  - P2：`方向键 + Numpad1/2`
- Debug：
  - `F1`：显示判定框 + FPS 标签。
  - `F2`：显示输入历史（缓冲内容）。
- 角色里程碑：
  - 4 个普通技：`5LP / 5HP / 2LP / jLP`
  - 1 个必杀：`QCF + LP`（`↓↘→ + J`）

---

## 运行（开发）

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 构建（发布）

```bash
npm run build
```

产物输出在 `dist/`，可作为静态站点部署。

## 项目结构

```text
src/
  data/hero.ts      # 角色与招式帧数据（数据驱动核心）
  game.ts           # 固定时间步循环、状态机、碰撞、渲染
  input.ts          # 键位映射、输入缓冲、指令识别
  types.ts          # 类型定义
  main.ts           # 启动入口
  style.css         # 页面样式
```

## 如何添加新招式

1. 打开 `src/data/hero.ts` 的 `moves`。
2. 新增一个 `MoveDef`：
   - 必填：`startup/active/recovery/totalFrames/damage/hitstun/knockbackX/knockbackY/cancelWindow/input/hitboxes`。
3. 在 `src/game.ts` 的 `trySpecial` 或 `tryNormal` 中增加触发逻辑。
4. 若需要取消系统，利用 `cancelWindow` 在 `stepAttack` 增加可取消判断。

## 如何添加新角色

1. 复制 `src/data/hero.ts` 创建 `src/data/<newCharacter>.ts`。
2. 修改体型盒（push/hurt）与基础参数（速度、重力、HP）。
3. 在 `Game#createFighter` 初始化时选择不同 `CharacterDef`。
4. 若角色动作尺寸差异大，可在 `drawFighter` 加入按角色绘制分支。

## 说明

- 本骨架优先强调工程可扩展性（输入、判定、帧数据、状态机分层）。
- 渲染为 Canvas2D 原型表现，后续可替换为美术资源与动画系统。
