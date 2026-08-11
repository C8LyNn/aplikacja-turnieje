# Display Font — Valve Pulp Bold

Place `valvepulp-bold.ttf` in this directory to activate the Deadlock display font.

Used by `--app-font-deadlock-display` for Deadlock-themed tournament views (`.font-deadlock` CSS class).
Supports Polish characters. The file is **not** committed to the repository.

**Without the file:** `font-display: swap` causes the browser to render the fallback stack
(`'Georgia', 'Times New Roman', serif`) with no layout shift or console errors.
The Deadlock visual theme works fully — only the display font falls back to serif.

**With the file:** Drop `valvepulp-bold.ttf` here and hard-refresh the page.
No code change required — the `@font-face` rule already references this path.

Source: https://drive.google.com/drive/folders/1bz9JynTfk9gdFK1xxfUCUq37gPapjY_M

# Display Font

Place `valvepulp-bold.ttf` in this directory.

Used by `--font-deadlock-display` for Deadlock-themed tournament views.
Supports Polish characters. Not committed to the repository.

Without the file: `font-display: swap` causes the browser to render the
serif fallback stack (Georgia → Times New Roman → serif) with no layout
shift or console errors.
