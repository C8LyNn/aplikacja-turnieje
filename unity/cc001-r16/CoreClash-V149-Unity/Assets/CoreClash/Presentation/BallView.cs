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
    //   type      = body colour + letter mark (inside the ball)
    //   owner     = ring: P1 solid, P2 segmented (colour is never the only cue)
    //   HP        = plate outside the ball; no P1/P2 text over balls
    public static class BallView
    {
        const int SpriteSize = 96;
        static readonly Dictionary<string, Texture2D> BodySprites = new Dictionary<string, Texture2D>();
        static BallIdentity identity;
        public static void SetIdentity(BallIdentity value){identity=value;}
        static string Mark(BallDefinition definition)=>definition==null?"?":identity?.Mark(definition.id)??"?";

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay)
            => Render(board,ball,definition,replay,ball.x,ball.y,0);

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay,float x,float y,int localOwner=0,bool selected=false)
        {
            float scale = board.width / 540f;
            float radius = ball.radius * scale;
            var point = ViewPoint(board,x,y,localOwner);
            var body = new Rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            Color team = Draw.Owner(ball.owner);
            Color color = definition == null ? Color.white : Draw.Hex(definition.color);

            DrawWake(point, ball, color, scale,localOwner);
            if (replay)
            {
                // W18-02 (#287): Replay uses its own gold pulse, not the team colour.
                float pulse = (5 + Mathf.Sin(Time.unscaledTime * 4 + ball.id) * 1.2f) * scale;
                Draw.Circle(Expand(body, pulse + 3 * scale), Alpha(ReplayColor, .1f));
                Draw.Ring(point, radius + pulse, Alpha(ReplayColor, .85f), Mathf.Max(1.5f, 2.2f * scale));
                Draw.Ring(point, radius + pulse + 4 * scale, Alpha(ReplayColor, .22f), Mathf.Max(1, scale));
            }
            if (selected)
            {
                float reach = radius + Theme.SelectionRing * scale;
                Draw.Ring(point, reach, Color.white, Mathf.Max(1.5f, 2 * scale), 4, .7f);
            }
            DrawOrb(body, definition, ball.owner, scale, 1);
            string mark = Mark(definition);
            int markSize = Mathf.Max(7, Mathf.RoundToInt(radius * (mark.Length > 2 ? .6f : .72f)));
            MarkLabel(body, mark, markSize, color);
        }

        // Second pass: HP, shield, states, threat and Replay chip around the ball.
        public static void RenderBadges(Rect board, BallRuntime ball, bool replay,float x,float y,int localOwner,UiBox field)
        {
            float scale = board.width / 540f;
            var point = ViewPoint(board,x,y,localOwner);
            var layout = BallBadges.Layout(ball,point.x,point.y,scale,replay,field);
            int font = layout.Font;
            Color team = Draw.Owner(ball.owner);

            // HP plate in the owner's colour. A damaged ball also gets a thin bar that shortens
            // and turns amber, then red; a full-health plate stays plain.
            var hp = RectOf(layout.Hp);
            float fraction = ball.maxHp > 0 ? Mathf.Clamp01((float)ball.hp / ball.maxHp) : 1;
            bool hurt = ball.hp < ball.maxHp;
            Color health = fraction < Theme.HpCriticalBelow ? Theme.HpCritical : fraction < Theme.HpHurtBelow ? Theme.HpHurt : Theme.HpGood;
            Draw.Chip(hp, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(team, .9f));
            float bar = Mathf.Max(1.5f, 2 * scale);
            Draw.Text(new Rect(hp.x, hp.y - (hurt ? bar * .5f + .5f : 0), hp.width, hp.height), ball.hp.ToString(), font, fraction < Theme.HpHurtBelow ? health : Theme.Text, TextAnchor.MiddleCenter, true);
            if (hurt) Draw.Rect(new Rect(hp.x + 3, hp.yMax - bar - 1.5f, (hp.width - 6) * fraction, bar), health);

            if (layout.HasShield)
            {
                var shield = RectOf(layout.Shield);
                Draw.Chip(shield, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(Theme.Shield, .9f));
                float glyph = shield.height - 3;
                Glyphs.Paint(new Rect(shield.x + 2, shield.y + 1.5f, glyph, glyph), StatusKind.Shield, Theme.Shield);
                Draw.Text(new Rect(shield.x + glyph + 2, shield.y - 1, shield.width - glyph - 3, shield.height), ball.shield.ToString(), font, Theme.Text, TextAnchor.MiddleCenter, true);
            }
            foreach (var chip in layout.Chips)
            {
                var box = RectOf(chip.Box);
                Color tint = Theme.Status(chip.Kind);
                Draw.Chip(box, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(tint, .75f));
                float glyph = box.height - 3;
                Glyphs.Paint(new Rect(box.x + 1.5f, box.y + 1.5f, glyph, glyph), chip.Kind, tint);
                if (chip.Text.Length > 0)
                    Draw.Text(new Rect(box.x + glyph + 2, box.y - 1, box.width - glyph - 3, box.height), chip.Text, font, Theme.Text, TextAnchor.MiddleCenter, true);
            }
            if (layout.Hidden > 0)
            {
                var more = RectOf(layout.Overflow);
                Draw.Chip(more, Alpha(Theme.Plate, Theme.PlateAlpha), Alpha(Theme.Muted, .7f));
                Draw.Text(new Rect(more.x, more.y - 1, more.width, more.height), "+" + layout.Hidden, font, Theme.TextSoft, TextAnchor.MiddleCenter, true);
            }
            if (layout.HasThreat)
            {
                // Armed Mine: hazard badge. Time Bomb: the remaining own turns as a number.
                var threat = BallBadges.Threat(ball);
                var box = RectOf(layout.Threat);
                float beat = .5f + .5f * Mathf.Sin(Time.unscaledTime * (threat.Short == "1" ? 11 : 6) + ball.id);
                Draw.Circle(Expand(box, (1.5f + beat * 2) * scale), Alpha(Theme.Threat, .28f));
                Draw.Circle(box, Theme.Threat);
                Draw.Circle(Expand(box, -1.5f), Theme.Ink);
                if (threat.Kind == StatusKind.Fuse)
                    Draw.Text(new Rect(box.x, box.y - 1, box.width, box.height), threat.Short, Mathf.Max(8, Mathf.RoundToInt(12 * scale)), Theme.Threat, TextAnchor.MiddleCenter, true);
                else
                    Glyphs.Paint(Expand(box, -3), StatusKind.Armed, Theme.Threat);
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
                Draw.Circle(Expand(body, 7 * unit), Alpha(Theme.Select, .07f));
                Draw.Circle(Expand(body, 4.5f * unit), Alpha(Theme.Select, .12f));
            }
            DrawOrb(body, definition, owner, unit, selected ? 1 : .8f);
            if(body.width>=24&&definition!=null)
            {
                string mark=Mark(definition);
                MarkLabel(body,mark,Mathf.Clamp(Mathf.RoundToInt(body.width*(mark.Length>2?.3f:.36f)),7,22),Draw.Hex(definition.color));
            }
        }

        // Shadow, ownership ring (P1 solid, P2 segmented) and the shaded sphere.
        static void DrawOrb(Rect body, BallDefinition definition, int owner, float scale, float ringAlpha)
        {
            Color team = Draw.Owner(owner);
            var center = body.center;
            float radius = body.width * .5f, ring = Mathf.Max(2, Theme.OwnerRing * scale), gap = Mathf.Max(1, Theme.OwnerGap * scale);
            Draw.Circle(new Rect(body.x + scale, body.y + 3.5f * scale, body.width, body.height), new Color(0, 0, 0, Theme.ShadowAlpha));
            Draw.Circle(Expand(body, gap + ring + .5f), Theme.Ink);
            if (owner == 1) Draw.Ring(center, radius + gap + ring, Alpha(team, ringAlpha), ring, Theme.P2RingSegments, Theme.P2RingFill);
            else Draw.Ring(center, radius + gap + ring, Alpha(team, ringAlpha), ring);
            DrawBody(body, definition);
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

        // One material for every ball: a matte-glass sphere lit from the upper left,
        // with a dark rim (reads on any floor), a soft highlight and a faint bounce light.
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
            Color deep = Color.Lerp(new Color(.02f, .035f, .06f), color, Theme.BodyDark);
            for (int y = 0; y < SpriteSize; y++)
            for (int x = 0; x < SpriteSize; x++)
            {
                float nx = (x + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float ny = -(y + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float distance = Mathf.Sqrt(nx * nx + ny * ny);
                if (distance > 1.02f) continue;
                float nz = Mathf.Sqrt(Mathf.Max(0, 1 - distance * distance));
                float light = Mathf.Clamp01(-nx * .42f - ny * .52f + nz * .72f);
                Color pixel = Color.Lerp(deep, color, Mathf.SmoothStep(0, 1, .12f + light * .95f));
                // Rim darkening separates the sphere from the ownership ring.
                pixel = Color.Lerp(pixel, deep * .55f, Mathf.Pow(distance, 5) * .75f);
                // Bounce light from the floor on the lower right.
                float bounce = Mathf.Clamp01(nx * .35f + ny * .6f - .35f) * (1 - nz);
                pixel = Color.Lerp(pixel, Color.Lerp(color, Color.white, .35f), bounce * .5f);
                float highlight = Mathf.Exp(-((nx + .36f) * (nx + .36f) + (ny + .42f) * (ny + .42f)) * 15);
                pixel = Color.Lerp(pixel, Color.white, highlight * Theme.BodyHighlight);
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
            for (int i = Theme.WakeSteps; i > 0; i--)
            {
                float t = i / (float)Theme.WakeSteps;
                Vector2 p = point - direction * (radius * .6f + length * t);
                float r = radius * (1 - t * .55f);
                Draw.Circle(new Rect(p.x - r, p.y - r, r * 2, r * 2), Alpha(color, Theme.WakeAlpha * (1 - t * .8f)));
            }
        }

        // Type mark: dark on light bodies, light on dark ones, with a thin opposite edge.
        static void MarkLabel(Rect body, string text, int size, Color bodyColor)
        {
            float luminance = bodyColor.r * .299f + bodyColor.g * .587f + bodyColor.b * .114f;
            bool darkText = luminance > .6f;
            Color ink = darkText ? new Color(.03f, .07f, .11f, .95f) : new Color(.97f, .99f, 1, .97f);
            Color edge = darkText ? new Color(1, 1, 1, .35f) : new Color(.01f, .03f, .05f, .7f);
            var box = new Rect(body.x - 4, body.y, body.width + 8, body.height);
            Draw.Text(new Rect(box.x, box.y + 1, box.width, box.height), text, size, edge, TextAnchor.MiddleCenter, true);
            Draw.Text(box, text, size, ink, TextAnchor.MiddleCenter, true);
        }

        static Vector2 ViewPoint(Rect board,float x,float y,int localOwner)
        {
            float scale = board.width / 540f;
            return new Vector2(board.x + MatchPerspective.ViewX(x,localOwner) * scale, board.y + MatchPerspective.ViewY(y,localOwner) * scale);
        }
        static Rect RectOf(UiBox r)=>new Rect(r.x,r.y,r.width,r.height);
        static Rect Expand(Rect rect, float amount) => new Rect(rect.x - amount, rect.y - amount, rect.width + amount * 2, rect.height + amount * 2);
        static readonly Color ReplayColor = Draw.Gold;
        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
    }
}
