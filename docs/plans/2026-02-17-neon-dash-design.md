# Neon Dash - Endless Runner Redesign

## Goal
Pivot Stack Dash from a confusing block-stacking game to a proper 3-lane endless runner with combo chains and neon dash trails. Built with React Three Fiber.

## Core Loop

Third-person endless runner in a neon cyber-city. Character auto-runs forward through 3 lanes. Speed increases over time. Dodge obstacles by switching lanes, jumping, and sliding.

**The twist: Combo chains + dash trails.** Every near-miss (passing close to an obstacle without hitting it) adds to your combo multiplier and extends a glowing neon trail behind you. Chain near-misses to build massive multipliers. Hit anything = combo resets, trail vanishes, speed penalty. Three hits = dead.

## Controls

### Mobile (tap zones, one-hand friendly)
- Tap left side of screen → move one lane left
- Tap right side of screen → move one lane right
- Tap center of screen → jump
- Swipe down anywhere → slide

### Desktop (keyboard)
- Left/Right arrows (or A/D) → lane switch
- Space bar (or Up arrow) → jump
- Down arrow (or S) → slide

Game auto-detects input method.

## Obstacles (progressive unlock by distance)

| Obstacle | Distance | Description |
|----------|----------|-------------|
| Barrier | 0 | Blocks one lane, lane-switch to dodge |
| Low bar | 0 | Must slide under |
| Gap jump | 50 | Missing floor, must jump |
| Double barrier | 100 | Blocks 2 lanes, only 1 safe |
| Overhead beam | 200 | Must slide, jumping hits it |
| Moving barrier | 400 | Shifts between lanes over time |

## Combo / Trail System

- Near-miss threshold: ~0.5 units from obstacle
- Combo chain multiplier tiers:
  - 5 chain → 1.5x
  - 10 chain → 2x
  - 20 chain → 3x
  - 50 chain → 5x
- Neon trail grows longer and brighter with combo
- Trail color shifts through spectrum at high combos
- Hit resets combo to 0, costs 1 HP (3 HP total)

## Scoring

- Base: distance traveled (speed * delta * 10)
- Multiplied by combo multiplier
- Near-miss bonus: +50 per near-miss
- Score displayed in HUD with combo counter

## Visual Style — Neon Cyber-City

- Dark city street with neon-lit building silhouettes on sides
- Glowing obstacles (barriers = red/magenta, collectibles = cyan)
- 3-lane road with lane markings (subtle glow)
- Player: geometric humanoid (capsule body) with neon glow that intensifies with combo
- Post-processing: bloom, vignette, chromatic aberration at high speed
- Screen shake on hit, speed lines at high speed
- Fog/atmosphere with color shifts based on distance

## Tech Stack (reused from Stack Dash)

- React Three Fiber + @react-three/rapier (physics)
- Zustand (state management)
- Vite (build)
- Existing systems kept: audio, screen effects, share/challenge, post-processing, seeded PRNG

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| Player | Rolling ball | Capsule character with jump/slide/lane-switch |
| Track | Gap-based platforms | 3-lane road with obstacles |
| BlockStack | Tap to place blocks | Remove entirely |
| Controls | Tap to place | Tap zones + keyboard |
| Game store | Block-related state | HP, combo, lane, jump/slide state |
| Track generator | Platform/gap segments | Lane-based obstacle patterns |
| HUD | Score only | Score + combo counter + HP |

## Player State Machine

```
idle (running) → jumping → falling → idle
idle (running) → sliding → idle
idle (running) → lane-switching → idle
any state → hit → invulnerable → idle
hit (HP=0) → dead
```

## Architecture

- `Player.tsx` — capsule rigid body, state machine for jump/slide/lane, input handling
- `Track.tsx` — procedural 3-lane road segments, infinite scrolling
- `Obstacles.tsx` — barrier, low bar, gap, double barrier, overhead beam, moving barrier
- `DashTrail.tsx` — neon trail effect behind player, scales with combo
- `ComboSystem.ts` — near-miss detection, combo state, multiplier calculation
- `InputSystem.ts` — unified touch/keyboard input, tap zone detection, swipe detection
- `gameStore.ts` — reworked: hp, combo, lane, isJumping, isSliding, speed, score
