# Coordination with the combat implementation

This change owns ONLY supplemental artwork and visual animation. No inputs, hitboxes, damage, cooldowns, CPU, jump physics, or round rules are changed.

`ExtraMovements.preload(scene)` loads the two additional transparent sheets; create `new ExtraMovements(scene)` after preload, then call `render(fighter, baseImage, time, mode, winnerId)` after rendering the base sprite. `render` restores the base sprite when no extra pose applies.

Nine poses per fighter: walk1, walk2, jump, crouch, block, uppercut, airKick, victory, ko. Supported action aliases are in `extra-movements.ts`. `crouching`, `blocking`, `grounded` flags are optional. Movement can be inferred from existing `walk` and `y`. The gameplay owner must implement mechanics for crouch/block/uppercut; these assets do not imply those mechanics exist.

The main scene has a minimal import, preload call, renderer construction, and render call. Preserve these when changing combat logic or use this module from the replacement renderer. Winner id is optional: only pass it when the result is known. Tie rounds should leave it undefined.

## Current scene architecture

The game now uses `scenes/PreloadScene.ts`, `data/fighters.ts` and `systems/FighterArt.ts`. The active integration is `systems/AnimeAtlas.ts`: it registers the base and extra anime sheets as two multi-source textures (`pata-anime`, `edu-anime`), retaining the prefixes `mayin-` and `erp-`. Preload loads the neighborhood image under the existing `bar` key. Do not restore loading `fighters.png` or `bar.png`; those files have been deleted. `poseScale` preserves body scale for the supplemental poses. FighterArt resolves existing combat pose names automatically; combat logic is unchanged.
