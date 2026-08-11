# Deadlock Theme Assets — Require Developer Wiring

Assets here are NOT automatically used. Adding them requires a developer
to add conditional rendering in the relevant component.

- `archmother-portrait.png`  800×1200px, transparent bg — scoreboard background accent
- `hidden-king-portrait.png` same spec
- `archmother-icon.png`      128×128px compact icon
- `hidden-king-icon.png`     same spec
- `background-texture.png`   512×512px repeating tile

Source: https://drive.google.com/drive/folders/1bz9JynTfk9gdFK1xxfUCUq37gPapjY_M

Intended usage: render at opacity-10 to opacity-15 as absolute-positioned backgrounds
behind the relevant player's score area. Must never overlap player name, hero pick,
or score text (information hierarchy rule).
