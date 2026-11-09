---
name: SF restoration scope
description: Preserve the standalone SF page while restoring the landing tile from the accepted reference.
---

Restoring the landing SF tile does not authorize changing the standalone `/sf` page's signal or effects.

**Why:** The user explicitly requested the accepted localhost tile behavior while forbidding changes to `/sf`, other landing tiles, and Portfolio.

**How to apply:** Verify the standalone panel's shared behavior and styles, not only its route file. Keep landing-specific animation changes scoped to the tile.

An accepted localhost reference is authoritative for requests for an exact restoration; a specification-based reconstruction is not proof of an identical implementation.

**Why:** The user specifically distinguishes the accepted localhost version from later workspace changes.

**How to apply:** Use the original accepted source or the user's explicit reference formulas for strict comparisons. Do not substitute generic seeded hashing when precise formulas are supplied.

Do not add vertical ghost offsets or whole-card/content movement to the accepted SF tile effect.

**Why:** The user rejected the added vertical offset as a deviation from localhost and supplied exact horizontal-only effect formulas.

**How to apply:** Keep ghost transforms horizontal, scope icon skew and offset to the glyph itself, and keep frame/container geometry fixed. Changing scanline or slice top positions is intentional and is distinct from vertically translating text or the card.

The landing SF background must stay dark, visually unified, and subtle during glitches; cyan is the main accent and fuchsia is restricted to small transient text/line artifacts.

**Why:** The user explicitly rejected the broad cyan/fuchsia background split and requested a palette-only correction without changing layout, contents, randomness, or animation timing.

**How to apply:** Do not reintroduce fuchsia into broad background washes. Preserve local ghost/shadow/scanline effects and the approved animation algorithm when adjusting the palette.
