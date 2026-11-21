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
        static BallIdentity identity;
        public static void SetIdentity(BallIdentity value){identity=value;}
        static string Mark(BallDefinition definition)=>definition==null?"?":identity?.Mark(definition.id)??"?";

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay)
            => Render(board,ball,definition,replay,ball.x,ball.y,0);

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay,float x,float y,int localOwner=0,bool selected=false)
        {
            float scale = board.width / 540f, now = Time.unscaledTime;
            // Drawn radius: the rules radius plus BallGrow (the HP gauge now lies inside the ball).
            float radius = (ball.radius + Theme.BallGrow) * scale, edge = radius + Theme.BallInk * scale;
            var point = ViewPoint(board,x,y,localOwner);
            var body = new Rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            Color team = Draw.Owner(ball.owner);
            Color color = definition == null ? Color.white : Draw.Hex(definition.color);

            DrawWake(point, ball, color, scale,localOwner);
            if (replay)
            {
                // W18-02 (#287): Replay uses its own gold pulse, not the team colour.
                float pulse = (3 + Mathf.Sin(now * 4 + ball.id) * 1.2f) * scale;
                Draw.Glow(point, edge + pulse + 12 * scale, Alpha(ReplayColor, .5f));
                Draw.Ring(point, edge + pulse, Alpha(ReplayColor, .85f), Mathf.Max(1.5f, 2.6f * scale));
                Draw.Ring(point, edge + pulse + 4 * scale, Alpha(ReplayColor, .3f), Mathf.Max(1, scale));
            }
            if (selected)
            {
                float reach = edge + (Theme.SelectionRing - 4) * scale;
                Draw.Ring(point, reach + scale, Alpha(Theme.Ink, .5f), Mathf.Max(2.5f, 4 * scale), 4, .7f);
                Draw.Ring(point, reach, Color.white, Mathf.Max(1.5f, 2.2f * scale), 4, .7f);
            }
            // HP as a share of the ball's maximum: the arc follows the real HP, not 5 HP steps.
            float share = Mathf.Clamp01(ball.hp / (float)Mathf.Max(1, ball.maxHp)), shareBefore = 0, lostFade = 0;
            if (Fx.LostHp(ball.id, now, out int hpBefore, out float fade)) { shareBefore = Mathf.Clamp01(hpBefore / (float)Mathf.Max(1, ball.maxHp)); lostFade = fade; }
            DrawOrb(body, definition, ball.owner, scale, 1, share, BallBadges.PipSide(ball.owner, localOwner), BallBadges.PipSize(scale), shareBefore, lostFade, BallBadges.HpSegments(ball.maxHp));
            DrawIdentity(body, definition, color, InnerRadius(radius), false, ball.owner);
            DrawState(body, point, ball, radius, scale, now);
        }

        // What the ball is going through right now, drawn on the ball: flames, ice shell, shield bubble,
        // plus the short flashes for a hit, a heal and an absorbed hit.
        static void DrawState(Rect body, Vector2 point, BallRuntime ball, float radius, float scale, float now)
        {
            // W24 (owner direction): states are kept minimal. What a ball carries is told by its small
            // chip under it (symbol and number); on the ball itself only two things show, each as one
            // plain shape: a frozen ball is washed in ice, a shielded one has a thin ring round it.
            if (ball.frozen > 0) Draw.Circle(body, Alpha(Theme.Status(StatusKind.Frozen), .58f));
            if (ball.shield > 0 || ball.divineShield)
                Draw.Ring(point, radius + (Theme.BallInk + 3.2f) * scale, ball.divineShield ? Theme.Status(StatusKind.Divine) : Theme.Shield, Mathf.Max(1.5f, 2.2f * scale));
            float flash = Fx.HitFlash(ball.id, now);
            if (flash > 0) Draw.Circle(body, Alpha(Color.white, .6f * flash));
            float heal = Fx.HealGlow(ball.id, now);
            if (heal > 0) Draw.Circle(body, Alpha(Theme.Heal, .4f * heal));
            float absorb = Fx.AbsorbGlow(ball.id, now);
            if (absorb > 0) Draw.Circle(Expand(body, 5 * scale), Alpha(Theme.Shield, .4f * absorb));
        }

        // Icon when the ball has one, otherwise the W20 letter mark.
        static void DrawIdentity(Rect body, BallDefinition definition, Color bodyColor, float radius, bool preview, int owner = 0)
        {
            // W24 (owner decision): the Standard ball is plain - an empty ball with no symbol.
            if (Plain(definition)) { DrawShine(body); return; }
            string spec = definition == null ? null : BallIcons.Spec(definition.id);
            if (spec != null)
            {
                // One look for every ball: a white symbol with a soft edge in a dark tone of the body colour.
                float half = radius * Theme.IconSize * .5f;
                var box = new Rect(body.center.x - half, body.center.y - half, half * 2, half * 2);
                Glyphs.PaintOutline(box, spec, Alpha(Label(definition).IconEdge, .8f));
                Glyphs.Paint(box, spec, Color.white);
                DrawShine(body);
                return;
            }
            string mark = Mark(definition);
            int size = preview ? Mathf.Clamp(Mathf.RoundToInt(body.width * (mark.Length > 2 ? .3f : .36f)), 7, 22) : Mathf.Max(7, Mathf.RoundToInt(radius * (mark.Length > 2 ? .6f : .72f)));
            MarkLabel(body, mark, size, bodyColor);
            DrawShine(body);
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
            if (Theme.ShowHpNumber)
            {
                Draw.Chip(hp, team, critical ? Theme.Damage : Color.white);
                Draw.Text(new Rect(hp.x, hp.y + 1, hp.width, hp.height), ball.hp.ToString(), font, new Color(0, 0, 0, .3f), TextAnchor.MiddleCenter, true);
                Draw.Text(hp, ball.hp.ToString(), font, health, TextAnchor.MiddleCenter, true);
            }
            // Without the number, the shield plate is centred and the status row moves up into the free row.
            float rowShift = Theme.ShowHpNumber ? 0 : (layout.RowHeight + Mathf.Max(1f, 1.5f * scale)) * (layout.Above ? 1 : -1);
            float shieldShift = Theme.ShowHpNumber ? 0 : -(hp.width + Mathf.Max(1f, 1.5f * scale)) * .5f;

            if (layout.HasShield)
            {
                var shield = RectOf(layout.Shield); shield.x += shieldShift; if (!Theme.ShowHpNumber && layout.Chips.Length > 0) shield.x -= shield.width * .5f + 1;
                Draw.Chip(shield, Alpha(Theme.Plate, Theme.PlateAlpha), Theme.Shield);
                float glyph = shield.height - 3;
                Glyphs.Paint(new Rect(shield.x + 2, shield.y + 1.5f, glyph, glyph), StatusKind.Shield, Theme.Shield);
                Draw.Text(new Rect(shield.x + glyph + 2, shield.y - 1, shield.width - glyph - 3, shield.height), ball.shield.ToString(), font, Theme.PlateText, TextAnchor.MiddleCenter, true);
            }
            foreach (var chip in layout.Chips)
            {
                var box = RectOf(chip.Box); if (layout.HasShield && !Theme.ShowHpNumber) box.x += RectOf(layout.Shield).width * .5f + 1; else box.y += rowShift;
                Color tint = Theme.Status(chip.Kind);
                Draw.Chip(box, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(tint, .95f));
                float glyph = box.height - 3;
                Glyphs.Paint(new Rect(box.x + 1.5f, box.y + 1.5f, glyph, glyph), chip.Kind, tint);
                if (chip.Text.Length > 0)
                    Draw.Text(new Rect(box.x + glyph + 2, box.y - 1, box.width - glyph - 3, box.height), chip.Text, font, Theme.PlateText, TextAnchor.MiddleCenter, true);
            }
            if (layout.Hidden > 0)
            {
                var more = RectOf(layout.Overflow); if (layout.HasShield && !Theme.ShowHpNumber) more.x += RectOf(layout.Shield).width * .5f + 1; else more.y += rowShift;
                Draw.Chip(more, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(Theme.PlateSoft, .7f));
                Draw.Text(new Rect(more.x, more.y - 1, more.width, more.height), "+" + layout.Hidden, font, Theme.PlateSoft, TextAnchor.MiddleCenter, true);
            }
            if (layout.HasThreat)
            {
                // Armed Mine: hazard badge. Time Bomb: the remaining own turns as a number.
                var threat = BallBadges.Threat(ball);
                var box = RectOf(layout.Threat);
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
            // A catalog orb is at full health; a tiny one has a plain ring and no gauge.
            bool gauge = body.width >= 24 && definition != null;
            DrawOrb(body, definition, owner, unit, 1, gauge ? 1 : -1, body.width >= 24 ? -1 : 0, Mathf.Max(5, 7.5f * unit), 0, 0, gauge ? BallBadges.HpSegments(definition.hp) : 0);
            if (definition != null && (body.width >= 24 || body.width >= 12 && BallIcons.Has(definition.id)))
                DrawIdentity(body, definition, Draw.Hex(definition.color), InnerRadius(body.width * .5f), true, owner);
            else DrawShine(body);
        }

        // The ball (W24). A sphere in the owner's colour with a soft shadow on the floor; in its middle
        // a round label in the ball's own colour; round the label the HP gauge (a dark track with a
        // smooth white arc for the HP that is left, a thin mark every 5 HP; what was lost a moment
        // ago flashes red). One shared pair of sprites lights every ball from the upper left and
        // gives it its shine, so every ball reads as the same kind of object.
        // A small orb has no gauge. The Standard ball has no label.
        static bool Plain(BallDefinition definition) => definition != null && definition.id == "normal";
        // Radius of the label that carries the icon.
        static float InnerRadius(float radius) => radius * (radius < 12 ? .7f : Theme.LabelShare);
        sealed class Material { public Color Label, Outline, IconEdge; }
        static readonly Dictionary<string, Material> Materials = new Dictionary<string, Material>();
        static Material Label(BallDefinition definition)
        {
            string key = definition == null || string.IsNullOrEmpty(definition.color) ? "#d8e7f5" : definition.color;
            if (Materials.TryGetValue(key, out var material)) return material;
            Color color = Theme.Vivid(Draw.Hex(key));
            // A white symbol has to show on every label: a pale colour is brought down until it does.
            Color.RGBToHSV(color, out float hue, out float saturation, out float value);
            if (saturation < .16f) { saturation = .2f; value = Mathf.Min(value, .7f); }
            for (int i = 0; i < 12; i++)
            {
                color = Color.HSVToRGB(hue, saturation, value);
                if (color.r * .299f + color.g * .587f + color.b * .114f <= .6f) break;
                value *= .95f; saturation = Mathf.Min(1, saturation * 1.03f);
            }
            material = new Material { Label = color, Outline = Theme.Shade(color, 1.15f, .55f), IconEdge = Theme.Shade(color, 1.2f, .4f) };
            Materials[key] = material;
            return material;
        }
        // Light and shine of a sphere, shared by every ball: `shade` is laid over the ball in a dark
        // colour (the side away from the light, and the rim), `shine` in white (a broad sheen, one
        // bright highlight and a little light bounced back on the far edge).
        const int LightSize = 128;
        static Texture2D shade, shine;
        static void BuildLight()
        {
            shade = new Texture2D(LightSize, LightSize, TextureFormat.RGBA32, true) { name = "Core Clash ball shade", filterMode = FilterMode.Trilinear, wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave };
            shine = new Texture2D(LightSize, LightSize, TextureFormat.RGBA32, true) { name = "Core Clash ball shine", filterMode = FilterMode.Trilinear, wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave };
            var dark = new Color[LightSize * LightSize]; var bright = new Color[LightSize * LightSize];
            // Light from the upper left, a little towards the viewer. Texture rows start at the bottom: +ny is up.
            var light = new Vector3(-.52f, .62f, .59f).normalized; var half = (light + Vector3.forward).normalized;
            for (int y = 0; y < LightSize; y++)
            for (int x = 0; x < LightSize; x++)
            {
                float nx = (x + .5f - LightSize * .5f) / (LightSize * .5f - 1), ny = (y + .5f - LightSize * .5f) / (LightSize * .5f - 1);
                float distance = Mathf.Sqrt(nx * nx + ny * ny), edge = Mathf.Clamp01((1 - distance) * LightSize * .5f);
                if (distance > 1.02f) continue;
                float nz = Mathf.Sqrt(Mathf.Max(0, 1 - distance * distance));
                float lit = nx * light.x + ny * light.y + nz * light.z;
                float shadow = Mathf.SmoothStep(.12f, 1f, 1 - lit) * .42f + Mathf.Pow(1 - nz, 2.4f) * .2f;
                dark[y * LightSize + x] = new Color(1, 1, 1, Mathf.Clamp01(shadow) * edge);
                float highlight = Mathf.Pow(Mathf.Max(0, nx * half.x + ny * half.y + nz * half.z), 52f);
                float sheen = Mathf.SmoothStep(.62f, 1f, lit) * .22f;
                float bounce = Mathf.Max(0, -(nx * light.x + ny * light.y)) * Mathf.Pow(1 - nz, 2f) * .3f;
                bright[y * LightSize + x] = new Color(1, 1, 1, Mathf.Clamp01(Mathf.Max(highlight * .95f, sheen) + bounce) * edge);
            }
            shade.SetPixels(dark); shade.Apply(true, true); shine.SetPixels(bright); shine.Apply(true, true);
        }
        // Called once at start: everything a ball needs is built before the first shot, so nothing
        // is built in the middle of one.
        public static void Warm()
        {
            if (shade == null) BuildLight();
            Draw.WarmArcs(Theme.HpWidthShare / Theme.HpOuterShare);
        }
        static readonly Color FloorShadow = new Color(.1f, .08f, .31f), ShadeTone = new Color(.07f, .04f, .24f);
        static void DrawOrb(Rect body, BallDefinition definition, int owner, float scale, float ringAlpha, float hp, int pip, float pipSize, float hpBefore, float lostFade, int parts = 0)
        {
            if (shade == null) BuildLight();
            Color team = Draw.Owner(owner), edge = Theme.Shade(team, 1.05f, .46f);
            var center = body.center;
            float radius = body.width * .5f, ink = Mathf.Max(1f, Theme.BallInk * scale), label = InnerRadius(radius);
            // Shadow on the floor, away from the light.
            Draw.Glow(new Rect(center.x - radius * .92f, center.y + radius * .12f, radius * 2.2f, radius * 1.34f), Alpha(FloorShadow, .34f));
            Draw.Circle(Expand(body, ink), edge);
            Draw.Circle(body, team);
            if (pip != 0) OwnerPip(center, radius + ink * .5f, pip, pipSize, team, edge);
            Color old = GUI.color;
            GUI.color = Alpha(ShadeTone, .85f); GUI.DrawTexture(body, shade); GUI.color = old;
            if (hp >= 0)
            {
                float outer = radius * Theme.HpOuterShare, width = radius * Theme.HpWidthShare;
                Draw.Ring(center, outer, Theme.Shade(team, 1.05f, .34f), width);
                if (hpBefore > hp && lostFade > 0) Draw.Arc(center, outer, Alpha(Theme.Damage, lostFade), width, hpBefore);
                Draw.Arc(center, outer, Color.white, width, hp);
                // A thin mark at every 5 HP, so the HP can still be counted.
                Draw.Ticks(center, outer, Theme.Shade(team, 1.05f, .34f), width, parts, Mathf.Max(1f, radius * .07f));
            }
            if (!Plain(definition))
            {
                var material = Label(definition);
                var disc = new Rect(center.x - label, center.y - label, label * 2, label * 2);
                Draw.Circle(Expand(disc, Mathf.Max(.8f, radius * .045f)), material.Outline);
                Draw.Circle(disc, material.Label);
            }
            GUI.color = Alpha(ShadeTone, .22f); GUI.DrawTexture(body, shade); GUI.color = old;
        }
        // The highlight goes on last, over the symbol's edge as well, like light on glass.
        static void DrawShine(Rect body)
        {
            if (shine == null) BuildLight();
            Color old = GUI.color; GUI.color = Color.white; GUI.DrawTexture(body, shine); GUI.color = old;
        }

        // Owner pip: a triangle sitting on the ring. side -1 = on top pointing up (the viewer's
        // own balls), 1 = underneath pointing down (the opponent's).
        const string PipUp = "+P 0 -1 1 .7 -1 .7", PipDown = "+P 0 1 1 -.7 -1 -.7";
        static void OwnerPip(Vector2 center, float outer, int side, float size, Color team, Color edge)
        {
            float tip = outer + size * .62f;
            var box = new Rect(center.x - size * .5f, side < 0 ? center.y - tip : center.y + tip - size, size, size);
            Glyphs.Paint(Expand(box, 1.5f), side < 0 ? PipUp : PipDown, edge);
            Glyphs.Paint(box, side < 0 ? PipUp : PipDown, team);
        }

        // Motion trail behind a fast ball: fading discs in the ball's own colour.
        static void DrawWake(Vector2 point, BallRuntime ball, Color color, float scale,int localOwner)
        {
            var velocity = localOwner==1?new Vector2(ball.vx,-ball.vy):new Vector2(ball.vx,ball.vy);
            if (!ball.moving || velocity.sqrMagnitude < 8100) return;
            float speed = velocity.magnitude, radius = (ball.radius + Theme.BallGrow) * scale;
            float length = Mathf.Min(Theme.WakeLength, speed * .13f) * scale;
            Vector2 direction = velocity / speed;
            int steps = Fx.ReducedMotion ? 2 : Theme.WakeSteps;
            for (int i = steps; i > 0; i--)
            {
                float t = i / (float)steps;
                Vector2 p = point - direction * (radius * .6f + length * t);
                float r = radius * (1 - t * .55f);
                Draw.Circle(new Rect(p.x - r, p.y - r, r * 2, r * 2), Alpha(Color.white, Theme.WakeAlpha * .8f * (1 - t * .8f)));
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
