using System.Collections.Generic;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W20: a ball is drawn in two passes so information never hides under a
    // neighbour: Render() paints the body (shadow, ownership ring, sphere, type mark),
    // RenderBadges() then paints everything around it (HP plate, shield, status chips,
    // threat badge, Replay chip) from the shared BallBadges layout.
    //   type      = body colour + icon inside the ball (W21: BallIcons; a ball without an
    //               icon yet keeps its letter mark)
    //   HP        = W21: ring around the body, one segment per 5 HP, lost segments dimmed,
    //               plus the exact number on a plate outside the ball
    //   owner     = ring colour + owner pip: a triangle on the ring, on top of the viewer's own
    //               balls and under the opponent's (colour is never the only cue); no P1/P2 text.
    //               W24: the HP plate is filled with the owner's colour as well.
    // CC-001 W24: candy material (glossy sphere, soft ground shadow, navy backing ring) and
    // state shown on the ball itself: flames on a burning ball, an ice shell on a frozen one,
    // a bubble around a shielded one. Hit pop, white hit flash and the lost-HP flash on the
    // ring come from Fx, which only reads real simulation changes.
    public static class BallView
    {
        const int SpriteSize = 128;
        static readonly Dictionary<string, Texture2D> BodySprites = new Dictionary<string, Texture2D>();
        static BallIdentity identity;
        public static void SetIdentity(BallIdentity value){identity=value;}
        static string Mark(BallDefinition definition)=>definition==null?"?":identity?.Mark(definition.id)??"?";

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay)
            => Render(board,ball,definition,replay,ball.x,ball.y,0);

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay,float x,float y,int localOwner=0,bool selected=false)
        {
            float scale = board.width / 540f, now = Time.unscaledTime;
            float radius = ball.radius * scale * Fx.BodyScale(ball.id, now);
            var point = ViewPoint(board,x,y,localOwner);
            var body = new Rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            Color team = Draw.Owner(ball.owner);
            Color color = definition == null ? Color.white : Draw.Hex(definition.color);

            DrawWake(point, ball, color, scale,localOwner);
            if (replay)
            {
                // W18-02 (#287): Replay uses its own gold pulse, not the team colour.
                float pulse = (5 + Mathf.Sin(now * 4 + ball.id) * 1.2f) * scale;
                Draw.Glow(point, radius + pulse + 14 * scale, Alpha(ReplayColor, .5f));
                Draw.Ring(point, radius + pulse, Alpha(ReplayColor, .85f), Mathf.Max(1.5f, 2.6f * scale));
                Draw.Ring(point, radius + pulse + 4 * scale, Alpha(ReplayColor, .3f), Mathf.Max(1, scale));
            }
            if (selected)
            {
                float reach = radius + Theme.SelectionRing * scale;
                Draw.Ring(point, reach + scale, Alpha(Theme.Ink, .5f), Mathf.Max(2.5f, 4 * scale), 4, .7f);
                Draw.Ring(point, reach, Color.white, Mathf.Max(1.5f, 2.2f * scale), 4, .7f);
            }
            // State glow under the ball: heat, cold. Real status fields only.
            if (ball.fireStacks > 0) Draw.Glow(point, radius * (1.9f + .12f * Mathf.Sin(now * 9 + ball.id)), Alpha(Theme.Status(StatusKind.Fire), .42f));
            else if (ball.frozen > 0) Draw.Glow(point, radius * 1.9f, Alpha(Theme.Status(StatusKind.Frozen), .6f));
            else if (ball.iceStacks > 0) Draw.Glow(point, radius * 1.7f, Alpha(Theme.Status(StatusKind.Ice), .3f));

            int segments = BallBadges.HpSegments(ball.maxHp), lit = BallBadges.HpLit(ball.hp, ball.maxHp), lostLit = 0; float lostFade = 0;
            if (Fx.LostHp(ball.id, now, out int hpBefore, out float fade)) { lostLit = BallBadges.HpLit(hpBefore, ball.maxHp); lostFade = fade; }
            DrawOrb(body, definition, ball.owner, scale, 1, segments, lit, BallBadges.PipSide(ball.owner, localOwner), BallBadges.PipSize(scale), lostLit, lostFade);
            DrawIdentity(body, definition, color, radius, false);
            DrawState(body, point, ball, radius, scale, now);
        }

        // What the ball is going through right now, drawn on the ball: flames, ice shell, shield bubble,
        // plus the short flashes for a hit, a heal and an absorbed hit.
        static void DrawState(Rect body, Vector2 point, BallRuntime ball, float radius, float scale, float now)
        {
            if (ball.frozen > 0)
            {
                // Ice shell: a pale cap over the body and three crystals on its rim.
                Color ice = Theme.Status(StatusKind.Frozen);
                Draw.Circle(Expand(body, 1.5f * scale), Alpha(ice, .5f));
                Draw.Ring(point, radius + 2 * scale, Alpha(Color.white, .9f), Mathf.Max(1.5f, 2.4f * scale));
                for (int i = 0; i < 3; i++)
                {
                    float angle = -2.2f + i * 2.1f + ball.id, size = radius * (.62f - .1f * i);
                    var p = point + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius * .98f;
                    Glyphs.Paint(new Rect(p.x - size / 2, p.y - size / 2, size, size), Fx.Shard, Alpha(Theme.Ink, .35f));
                    Glyphs.Paint(new Rect(p.x - size / 2 + 1, p.y - size / 2 - 1, size - 2, size - 2), Fx.Shard, Color.Lerp(ice, Color.white, .55f));
                }
            }
            else if (ball.iceStacks > 0)
            {
                // Chilled: frost marks on the rim, one per stack.
                for (int i = 0; i < Mathf.Min(3, ball.iceStacks); i++)
                {
                    float angle = -1.0f + i * 1.15f, size = Mathf.Max(6, radius * .62f);
                    var p = point + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * (radius + 1.5f * scale);
                    Glyphs.Paint(new Rect(p.x - size / 2 - 1, p.y - size / 2 - 1, size + 2, size + 2), Fx.Snow, Alpha(Theme.Ink, .8f));
                    Glyphs.Paint(new Rect(p.x - size / 2, p.y - size / 2, size, size), Fx.Snow, Color.Lerp(Theme.Status(StatusKind.Ice), Color.white, .7f));
                }
            }
            if (ball.fireStacks > 0)
            {
                // Flames lick over the top of the ball: more stacks, more flames.
                int flames = Mathf.Min(5, 2 + ball.fireStacks);
                for (int i = 0; i < flames; i++)
                {
                    float spread = flames == 1 ? 0 : (i / (float)(flames - 1) - .5f) * 2f;
                    float flicker = Fx.ReducedMotion ? .5f : .5f + .5f * Mathf.Sin(now * (9 + i * 1.7f) + ball.id * 1.3f + i * 2.1f);
                    float size = radius * (.78f + .3f * flicker) * (1 - Mathf.Abs(spread) * .28f);
                    var p = new Vector2(point.x + spread * radius * .82f, point.y - radius * (.78f - Mathf.Abs(spread) * .3f) - size * .22f * flicker);
                    Glyphs.Paint(new Rect(p.x - size / 2 - 1, p.y - size / 2 - 1, size + 2, size + 2), Fx.Flame, Alpha(new Color(.75f, .16f, .05f), .75f));
                    Glyphs.Paint(new Rect(p.x - size / 2, p.y - size / 2, size, size), Fx.Flame, Theme.Status(StatusKind.Fire));
                    Glyphs.Paint(new Rect(p.x - size * .28f, p.y - size * .1f, size * .56f, size * .56f), Fx.Flame, new Color(1, .9f, .38f));
                }
            }
            if (ball.toxinTurns > 0)
            {
                // Poisoned: two bubbles on the lower rim.
                Color toxin = Theme.Status(StatusKind.Toxin);
                for (int i = 0; i < 2; i++)
                {
                    float angle = 2.2f + i * .75f, size = Mathf.Max(6, radius * (.56f - .14f * i));
                    var p = point + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * (radius + 2 * scale);
                    Draw.Circle(new Rect(p.x - size / 2 - 1, p.y - size / 2 - 1, size + 2, size + 2), Theme.Ink);
                    Draw.Circle(new Rect(p.x - size / 2, p.y - size / 2, size, size), toxin);
                    Draw.Circle(new Rect(p.x - size * .28f, p.y - size * .3f, size * .3f, size * .3f), new Color(1, 1, 1, .8f));
                }
            }
            if (ball.shield > 0 || ball.divineShield)
            {
                // Bubble: a clear shell with one bright edge.
                Color bubble = ball.divineShield ? Theme.Status(StatusKind.Divine) : Theme.Shield;
                float reach = radius + (Theme.OwnerGap + Theme.HpRing + 3.5f) * scale, breathe = Fx.ReducedMotion ? 0 : Mathf.Sin(now * 2.4f + ball.id) * .6f * scale;
                Draw.Circle(new Rect(point.x - reach, point.y - reach, reach * 2, reach * 2), Alpha(bubble, .16f));
                Draw.Ring(point, reach + breathe, Alpha(bubble, .9f), Mathf.Max(1.5f, 2.6f * scale));
                Draw.Ring(point, reach + breathe - 2.2f * scale, Alpha(Color.white, .55f), Mathf.Max(1, 1.2f * scale), 3, .22f);
            }
            float flash = Fx.HitFlash(ball.id, now);
            if (flash > 0) Draw.Circle(body, Alpha(Color.white, .85f * flash));
            float heal = Fx.HealGlow(ball.id, now);
            if (heal > 0) { Draw.Circle(body, Alpha(Theme.Heal, .35f * heal)); Draw.Ring(point, radius + (10 - 6 * heal) * scale, Alpha(Theme.Heal, heal), Mathf.Max(1.5f, 2.4f * scale)); }
            float absorb = Fx.AbsorbGlow(ball.id, now);
            if (absorb > 0) Draw.Circle(Expand(body, 5 * scale), Alpha(Theme.Shield, .4f * absorb));
        }

        // Icon when the ball has one, otherwise the W20 letter mark.
        static void DrawIdentity(Rect body, BallDefinition definition, Color bodyColor, float radius, bool preview)
        {
            string spec = definition == null ? null : BallIcons.Spec(definition.id);
            if (spec != null)
            {
                bool dark = Luminance(bodyColor) > .68f;
                float half = radius * Theme.IconSize * .5f;
                var box = new Rect(body.center.x - half, body.center.y - half, half * 2, half * 2);
                float lift = Mathf.Max(1, radius * .08f);
                Color edge = Color.Lerp(bodyColor, Theme.Ink, .72f);
                Glyphs.Paint(new Rect(box.x, box.y + lift, box.width, box.height), spec, dark ? new Color(1, 1, 1, .5f) : new Color(edge.r, edge.g, edge.b, .7f));
                Glyphs.Paint(box, spec, dark ? new Color(.1f, .14f, .32f, .96f) : new Color(1, 1, 1, .98f));
                return;
            }
            string mark = Mark(definition);
            int size = preview ? Mathf.Clamp(Mathf.RoundToInt(body.width * (mark.Length > 2 ? .3f : .36f)), 7, 22) : Mathf.Max(7, Mathf.RoundToInt(radius * (mark.Length > 2 ? .6f : .72f)));
            MarkLabel(body, mark, size, bodyColor);
        }

        // Second pass: HP, shield, states, threat and Replay chip around the ball.
        public static void RenderBadges(Rect board, BallRuntime ball, bool replay,float x,float y,int localOwner,UiBox field)
        {
            float scale = board.width / 540f;
            var point = ViewPoint(board,x,y,localOwner);
            var layout = BallBadges.Layout(ball,point.x,point.y,scale,replay,field,localOwner);
            int font = layout.Font;
            Color team = Draw.Owner(ball.owner);

            // HP plate filled with the owner's colour: the exact number. How much is missing is the
            // ring's job (W21), so the plate has no bar; a hurt ball's number turns pale amber, and a
            // critical one gets a red edge.
            var hp = RectOf(layout.Hp);
            float fraction = ball.maxHp > 0 ? Mathf.Clamp01((float)ball.hp / ball.maxHp) : 1;
            bool critical = fraction < Theme.HpCriticalBelow;
            Color health = critical ? Theme.HpCritical : fraction < Theme.HpHurtBelow ? Theme.HpHurt : Theme.HpGood;
            Draw.Chip(hp, team, critical ? Theme.Damage : Alpha(Theme.Ink, .9f));
            Draw.Text(new Rect(hp.x, hp.y + 1, hp.width, hp.height), ball.hp.ToString(), font, new Color(0, 0, 0, .3f), TextAnchor.MiddleCenter, true);
            Draw.Text(hp, ball.hp.ToString(), font, health, TextAnchor.MiddleCenter, true);

            if (layout.HasShield)
            {
                var shield = RectOf(layout.Shield);
                Draw.Chip(shield, Alpha(Theme.Plate, Theme.PlateAlpha), Theme.Shield);
                float glyph = shield.height - 3;
                Glyphs.Paint(new Rect(shield.x + 2, shield.y + 1.5f, glyph, glyph), StatusKind.Shield, Theme.Shield);
                Draw.Text(new Rect(shield.x + glyph + 2, shield.y - 1, shield.width - glyph - 3, shield.height), ball.shield.ToString(), font, Theme.PlateText, TextAnchor.MiddleCenter, true);
            }
            foreach (var chip in layout.Chips)
            {
                var box = RectOf(chip.Box);
                Color tint = Theme.Status(chip.Kind);
                Draw.Chip(box, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(tint, .95f));
                float glyph = box.height - 3;
                Glyphs.Paint(new Rect(box.x + 1.5f, box.y + 1.5f, glyph, glyph), chip.Kind, tint);
                if (chip.Text.Length > 0)
                    Draw.Text(new Rect(box.x + glyph + 2, box.y - 1, box.width - glyph - 3, box.height), chip.Text, font, Theme.PlateText, TextAnchor.MiddleCenter, true);
            }
            if (layout.Hidden > 0)
            {
                var more = RectOf(layout.Overflow);
                Draw.Chip(more, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(Theme.PlateSoft, .7f));
                Draw.Text(new Rect(more.x, more.y - 1, more.width, more.height), "+" + layout.Hidden, font, Theme.PlateSoft, TextAnchor.MiddleCenter, true);
            }
            if (layout.HasThreat)
            {
                // Armed Mine: hazard badge. Time Bomb: the remaining own turns as a number.
                var threat = BallBadges.Threat(ball);
                var box = RectOf(layout.Threat);
                float beat = .5f + .5f * Mathf.Sin(Time.unscaledTime * (threat.Short == "1" ? 11 : 6) + ball.id);
                Draw.Circle(Expand(box, (1.5f + beat * 2) * scale), Alpha(Theme.Threat, .35f));
                Draw.Circle(Expand(box, 1), Theme.Ink);
                Draw.Circle(box, Theme.Threat);
                if (threat.Kind == StatusKind.Fuse)
                    Draw.Text(new Rect(box.x, box.y - 1, box.width, box.height), threat.Short, Mathf.Max(8, Mathf.RoundToInt(12 * scale)), Theme.Ink, TextAnchor.MiddleCenter, true);
                else
                    Glyphs.Paint(Expand(box, -3), StatusKind.Armed, Theme.Ink);
            }
            if (layout.HasReplay)
            {
                var chipBox = RectOf(layout.Replay);
                Draw.Circle(Expand(chipBox, 1), Theme.Ink);
                Draw.Circle(chipBox, ReplayColor);
                Draw.Text(new Rect(chipBox.x, chipBox.y - 1, chipBox.width, chipBox.height), ReplayAffordance.BallChip, Mathf.Max(7, Mathf.RoundToInt(10 * scale)), Theme.Ink, TextAnchor.MiddleCenter, true);
            }
        }

        // Shared by the launcher and the card tray: this previews a catalog orb, not a runtime ball.
        public static void Preview(Rect body, BallDefinition definition, int owner, bool selected = false)
        {
            float unit = Mathf.Max(.6f, body.width / 42.5f);
            if (selected)
            {
                Draw.Glow(body.center, body.width * .5f + 13 * unit, Alpha(Theme.Select, .55f));
            }
            // A catalog orb is at full health: the ring shows how many 5 HP segments the type starts with.
            int segments = body.width >= 24 && definition != null ? BallBadges.HpSegments(definition.hp) : 1;
            DrawOrb(body, definition, owner, unit, selected ? 1 : .92f, segments, segments, body.width >= 24 ? -1 : 0, Mathf.Max(5, 7.5f * unit), 0, 0);
            if (definition != null && (body.width >= 24 || body.width >= 12 && BallIcons.Has(definition.id)))
                DrawIdentity(body, definition, Draw.Hex(definition.color), body.width * .5f, true);
        }

        // Ground shadow, navy backing, HP ring in the owner's colour (pale track + lit 5 HP segments,
        // segments lost a moment ago flash white), owner pip and the glossy sphere.
        static void DrawOrb(Rect body, BallDefinition definition, int owner, float scale, float ringAlpha, int segments, int lit, int pip, float pipSize, int lostLit, float lostFade)
        {
            Color team = Draw.Owner(owner);
            var center = body.center;
            float radius = body.width * .5f, ring = Mathf.Max(2, Theme.HpRing * scale), gap = Mathf.Max(1, Theme.OwnerGap * scale);
            float outer = radius + gap + ring;
            Draw.Glow(new Vector2(center.x + scale, center.y + radius * .5f + 3 * scale), outer * 1.28f, new Color(.07f, .1f, .3f, Theme.ShadowAlpha));
            Draw.Circle(Expand(body, gap + ring + Mathf.Max(1, 1.5f * scale)), Theme.Ink);
            if (pip != 0) OwnerPip(center, outer, pip, pipSize, Alpha(team, ringAlpha));
            Draw.Segments(center, outer, Alpha(Color.Lerp(team, Color.white, .55f), Theme.HpTrack * ringAlpha), ring, segments, segments);
            if (lostLit > lit && lostFade > 0) Draw.Segments(center, outer, Alpha(Color.white, lostFade), ring, segments, lostLit);
            Draw.Segments(center, outer, Alpha(team, ringAlpha), ring, segments, lit);
            DrawBody(body, definition);
        }

        // Owner pip: a triangle sitting on the ring. side -1 = on top pointing up (the viewer's
        // own balls), 1 = underneath pointing down (the opponent's).
        const string PipUp = "+P 0 -1 1 .7 -1 .7", PipDown = "+P 0 1 1 -.7 -1 -.7";
        static void OwnerPip(Vector2 center, float outer, int side, float size, Color team)
        {
            float tip = outer + size * .62f;
            var box = new Rect(center.x - size * .5f, side < 0 ? center.y - tip : center.y + tip - size, size, size);
            Glyphs.Paint(Expand(box, 1.5f), side < 0 ? PipUp : PipDown, Theme.Ink);
            Glyphs.Paint(box, side < 0 ? PipUp : PipDown, team);
        }

        static void DrawBody(Rect body, BallDefinition definition)
        {
            string key = definition == null || string.IsNullOrEmpty(definition.color) ? "#d8e7f5" : definition.color;
            if (!BodySprites.TryGetValue(key, out var sprite) || sprite == null)
            {
                sprite = CreateBodySprite(Draw.Hex(key));
                BodySprites[key] = sprite;
            }
            Color old = GUI.color;
            GUI.color = Color.white;
            GUI.DrawTexture(body, sprite);
            GUI.color = old;
        }

        // One material for every ball (W24): a glossy candy sphere lit from the upper left. A darker
        // outline of the ball's own hue, a saturated body, a broad soft highlight with a small
        // sharp glint, and a rim light on the lower right.
        static Texture2D CreateBodySprite(Color color)
        {
            var sprite = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false)
            {
                name = "Core Clash orb",
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp,
                hideFlags = HideFlags.HideAndDontSave
            };
            var pixels = new Color[SpriteSize * SpriteSize];
            Color navy = new Color(.1f, .12f, .3f);
            Color deep = Color.Lerp(color, navy, Theme.BodyDark), outline = Color.Lerp(color, navy, .7f), bright = Color.Lerp(color, Color.white, .45f);
            for (int y = 0; y < SpriteSize; y++)
            for (int x = 0; x < SpriteSize; x++)
            {
                float nx = (x + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float ny = -(y + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float distance = Mathf.Sqrt(nx * nx + ny * ny);
                if (distance > 1.02f) continue;
                float nz = Mathf.Sqrt(Mathf.Max(0, 1 - distance * distance));
                float light = Mathf.Clamp01(-nx * .42f - ny * .56f + nz * .62f);
                Color pixel = Color.Lerp(deep, color, Mathf.SmoothStep(0, 1, light * 1.7f));
                pixel = Color.Lerp(pixel, bright, Mathf.SmoothStep(0, 1, (light - .55f) * 2.2f) * .75f);
                // Rim light from the floor on the lower right.
                float bounce = Mathf.Clamp01(nx * .5f + ny * .62f - .32f) * Mathf.Clamp01(1 - nz * 1.2f);
                pixel = Color.Lerp(pixel, bright, bounce * 1.1f);
                // Broad soft highlight and a small sharp glint.
                float soft = Mathf.Exp(-((nx + .3f) * (nx + .3f) * 5.5f + (ny + .42f) * (ny + .42f) * 9f));
                pixel = Color.Lerp(pixel, Color.white, soft * .5f);
                float glint = Mathf.Exp(-((nx + .4f) * (nx + .4f) + (ny + .47f) * (ny + .47f)) * 55);
                pixel = Color.Lerp(pixel, Color.white, Mathf.Clamp01(glint * 1.3f) * Theme.BodyHighlight);
                // Outline in the ball's own dark hue separates the sphere from the ring.
                pixel = Color.Lerp(pixel, outline, Mathf.SmoothStep(0, 1, Mathf.InverseLerp(.87f, .97f, distance)));
                pixel.a = Mathf.Clamp01((1 - distance) * SpriteSize * .5f);
                pixels[y * SpriteSize + x] = pixel;
            }
            sprite.SetPixels(pixels);
            sprite.Apply(false, true);
            return sprite;
        }

        // Motion trail behind a fast ball: fading discs in the ball's own colour.
        static void DrawWake(Vector2 point, BallRuntime ball, Color color, float scale,int localOwner)
        {
            var velocity = localOwner==1?new Vector2(ball.vx,-ball.vy):new Vector2(ball.vx,ball.vy);
            if (!ball.moving || velocity.sqrMagnitude < 8100) return;
            float speed = velocity.magnitude, radius = ball.radius * scale;
            float length = Mathf.Min(Theme.WakeLength, speed * .13f) * scale;
            Vector2 direction = velocity / speed;
            int steps = Fx.ReducedMotion ? 2 : Theme.WakeSteps;
            for (int i = steps; i > 0; i--)
            {
                float t = i / (float)steps;
                Vector2 p = point - direction * (radius * .6f + length * t);
                float r = radius * (1 - t * .55f);
                Draw.Circle(new Rect(p.x - r, p.y - r, r * 2, r * 2), Alpha(Color.Lerp(color, Color.white, .25f), Theme.WakeAlpha * (1 - t * .8f)));
            }
        }

        // Type mark: dark on light bodies, light on dark ones, with a thin opposite edge.
        static void MarkLabel(Rect body, string text, int size, Color bodyColor)
        {
            bool darkText = Luminance(bodyColor) > .68f;
            Color ink = darkText ? new Color(.1f, .14f, .32f, .96f) : new Color(1, 1, 1, .98f);
            Color edge = darkText ? new Color(1, 1, 1, .45f) : new Color(.08f, .1f, .28f, .6f);
            var box = new Rect(body.x - 4, body.y, body.width + 8, body.height);
            Draw.Text(new Rect(box.x, box.y + 1, box.width, box.height), text, size, edge, TextAnchor.MiddleCenter, true);
            Draw.Text(box, text, size, ink, TextAnchor.MiddleCenter, true);
        }

        static float Luminance(Color color) => color.r * .299f + color.g * .587f + color.b * .114f;
        static Vector2 ViewPoint(Rect board,float x,float y,int localOwner)
        {
            float scale = board.width / 540f;
            return new Vector2(board.x + MatchPerspective.ViewX(x,localOwner) * scale, board.y + MatchPerspective.ViewY(y,localOwner) * scale);
        }
        static Rect RectOf(UiBox r)=>new Rect(r.x,r.y,r.width,r.height);
        static Rect Expand(Rect rect, float amount) => new Rect(rect.x - amount, rect.y - amount, rect.width + amount * 2, rect.height + amount * 2);
        static readonly Color ReplayColor = Theme.Select;
        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
    }
}
