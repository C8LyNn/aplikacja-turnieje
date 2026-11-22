using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;

namespace CoreClash.Presentation
{
    // CC-001 W20: a ball is drawn in two passes so information never hides under a
    // neighbour: Render() paints the body (shadow, ownership ring, sphere, type mark),
    // RenderBadges() then paints everything around it (HP plate, shield, status chips,
    // threat badge, Replay chip) from the shared BallBadges layout.
    //   type      = the icon inside the ball (W21: BallIcons; a ball without an icon yet keeps
    //               its letter mark). W24: the type no longer colours the ball.
    //   HP        = W24: an arc along the ball's edge that follows the real HP (white, yellow
    //               when hurt, red when critical); no number.
    //   owner     = W24: the colour of the whole ball + owner pip: a triangle on the edge, on top
    //               of the viewer's own balls and under the opponent's (colour is never the only
    //               cue); no P1/P2 text.
    // CC-001 W24 (owner direction: readable first, and it looks like a game): a ball has one colour
    // - its owner's - one large white symbol for its type, and its HP as a gauge along its edge
    // whose colour follows the HP that is left. See DrawOrb.
    // Hit pop, white hit flash and the lost-HP flash on the gauge come from Fx, which only reads
    // real simulation changes.
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
            // Drawn radius: the outline ends exactly where the rules radius does (see Theme.BallGrow).
            float radius = (ball.radius + Theme.BallGrow) * scale, edge = radius + Theme.BallInk * scale;
            var point = ViewPoint(board,x,y,localOwner);
            var body = new Rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            Color team = Draw.Owner(ball.owner);
            Color color = definition == null ? Color.white : Draw.Hex(definition.color);

            DrawWake(point, ball, color, scale,localOwner);
            // W24 (owner direction: show which zone a ball is in): a ball that counts for a zone is
            // lit from below - red where it threatens the enemy's base, gold where it holds the centre
            // (the rules' own tests; a soft light on the floor, under every ball).
            {
                bool threat = CoreClash.Physics.ZoneResolver.TouchesEnemyZone(ball), centre = !threat && CoreClash.Physics.ZoneResolver.TouchesCenter(ball, BoardView.CentreRadius);
                if (threat || centre) Draw.Glow(point, edge * 1.42f, Alpha(threat ? Theme.Damage : Theme.Select, threat ? .7f : .6f));
            }
            if (replay)
            {
                // W18-02 (#287): Replay uses its own gold pulse, not the team colour.
                // W24: one steady gold ring that hugs the ball, so it does not reach over the balls
                // next to it.
                Draw.Ring(point, edge + Mathf.Max(1.5f, 2.2f * scale), Alpha(ReplayColor, .85f), Mathf.Max(1.5f, 2.4f * scale));
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
            // W24 (owner direction: "not an extra icon - the ball itself is to change: burn when it is
            // set alight, be frozen, carry the poison"): a state is the look of the ball.
            //   fire    flames stand over the ball (more and taller with a second fire) and it glows hot
            //   chill   the ball pales with frost, and ice crystals settle on it - one for each chill
            //   frozen  the ball is cased in ice: shards round it, a pale shell over it
            //   poison  the ball turns sickly green and bubbles rise from it
            //   stuck   a web lies over the ball
            // Exact numbers are in the ball's own card (tap the ball).
            bool burning = ball.fireStacks > 0, frozen = ball.frozen > 0, chilled = ball.iceStacks > 0 && !frozen, poisoned = ball.toxinTurns > 0;
            if (burning) Flames(point, edge, now, ball.id, ball.fireStacks);
            if (frozen) IceShards(point, edge, scale);
            DrawOrb(body, definition, ball.owner, scale, 1, share, BallBadges.PipSide(ball.owner, localOwner), BallBadges.PipSize(scale), shareBefore, lostFade, BallBadges.HpSegments(ball.maxHp));
            if (burning) Draw.Circle(body, Alpha(FireHot, ball.fireStacks > 1 ? .36f : .26f));
            if (poisoned) Draw.Circle(body, Alpha(Theme.Status(StatusKind.Toxin), .34f));
            if (chilled) Draw.Circle(body, Alpha(IcePale, Mathf.Min(.5f, .24f * ball.iceStacks)));
            // A frozen ball is washed in ice; its symbol stays white on top of the ice.
            if (frozen)
            {
                Draw.Circle(body, Alpha(Theme.Status(StatusKind.Frozen), .62f));
                Draw.Ring(point, edge, IcePale, Mathf.Max(2f, radius * .14f));
            }
            DrawIdentity(body, definition, InnerRadius(radius, true), false, ball.owner);
            if (chilled) Frost(point, radius, scale, ball.iceStacks);
            if (poisoned) Bubbles(point, edge, now, ball.id);
            if (ball.rooted) Web(point, radius, scale);
            // W24 six groups. Switched off: the ball goes grey and sparks jump off it. A Battery wears
            // its charges as bolts over its head, one for each charge it holds.
            if (ball.jammed > 0) { Draw.Circle(body, Alpha(new Color(.36f, .38f, .46f), .52f)); Sparks(point, edge, now, ball.id); }
            if (ball.type == "capacitor" && ball.charge > 0) Charges(point, edge, scale, ball.charge);
            DrawState(body, point, ball, radius, scale, now);
        }

        static readonly Color FireHot = new Color(1f, .5f, .08f), FlameCore = new Color(1f, .88f, .3f), IcePale = new Color(.84f, .96f, 1f);
        // A flame: a drop with its point up.
        const string FlameSpec = "+C 0 .38 .58;+P -.56 .26 0 -.98 .56 .26";
        // Flames behind the ball, standing over its upper edge. They flicker in size (not when the
        // player asked for calm effects): the ball is burning now.
        static void Flames(Vector2 point, float edge, float now, int id, int stacks)
        {
            int count = stacks > 1 ? 5 : 3; float spread = stacks > 1 ? 62f : 42f, tall = stacks > 1 ? .86f : .68f;
            Color dark = Theme.Shade(FireHot, 1.1f, .34f);
            for (int i = 0; i < count; i++)
            {
                float angle = (count == 1 ? 0 : Mathf.Lerp(-spread, spread, i / (count - 1f))) * Mathf.Deg2Rad;
                float flicker = Fx.ReducedMotion ? 1 : 1 + .11f * Mathf.Sin(now * 9f + i * 2.1f + id);
                // The middle flames are the tallest.
                float size = edge * tall * flicker * (1 - .22f * Mathf.Abs(i - (count - 1) * .5f) / Mathf.Max(1, (count - 1) * .5f));
                var foot = point + new Vector2(Mathf.Sin(angle), -Mathf.Cos(angle)) * edge * .78f;
                var box = new Rect(foot.x - size * .5f, foot.y - size * .82f, size, size);
                Glyphs.PaintOutline(box, FlameSpec, dark);
                Glyphs.Paint(box, FlameSpec, FireHot);
                float core = size * .52f;
                Glyphs.Paint(new Rect(foot.x - core * .5f, foot.y - core * .62f, core, core), FlameSpec, FlameCore);
            }
        }
        // Shards of ice standing out round a frozen ball, behind it.
        static void IceShards(Vector2 point, float edge, float scale)
        {
            Color dark = Theme.Shade(Theme.Status(StatusKind.Frozen), 1.1f, .34f);
            float line = Mathf.Max(1f, 1.4f * scale);
            for (int i = 0; i < 6; i++)
            {
                float angle = (i * 60f + 30f) * Mathf.Deg2Rad; var out_ = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)); var across = new Vector2(-out_.y, out_.x);
                float reach = edge * (i % 2 == 0 ? 1.3f : 1.2f);
                Vector2 tip = point + out_ * reach, a = point + out_ * edge * .78f + across * edge * .22f, b = point + out_ * edge * .78f - across * edge * .22f;
                Draw.Triangle(tip, a, b, .6f + line, dark);
                Draw.Triangle(tip, a, b, .6f, IcePale);
            }
        }
        // Frost on a chilled ball: one crystal for each chill, on its lower half.
        static void Frost(Vector2 point, float radius, float scale, int stacks)
        {
            float size = Mathf.Max(9f, radius * .56f); string spec = Glyphs.Shape(StatusKind.Ice);
            for (int i = 0; i < Mathf.Min(2, stacks); i++)
            {
                var at = point + new Vector2(i == 0 ? .62f : -.62f, .62f) * radius * .92f;
                Draw.InkedGlyph(new Rect(at.x - size * .5f, at.y - size * .5f, size, size), spec, Color.white, Mathf.Max(1f, 1.2f * scale));
            }
        }
        // Bubbles rising from a poisoned ball.
        static void Bubbles(Vector2 point, float edge, float now, int id)
        {
            Color fill = Color.Lerp(Theme.Status(StatusKind.Toxin), Color.white, .25f), dark = Theme.Shade(Theme.Status(StatusKind.Toxin), 1.1f, .32f);
            for (int i = 0; i < 3; i++)
            {
                float bob = Fx.ReducedMotion ? 0 : Mathf.Sin(now * 2.2f + i * 2.4f + id) * edge * .05f;
                float size = edge * (i == 0 ? .21f : i == 1 ? .16f : .12f);
                var at = point + new Vector2(i == 0 ? -.56f : i == 1 ? .5f : .86f, i == 0 ? -.66f : i == 1 ? -.76f : -.22f) * edge + new Vector2(0, bob);
                Draw.Circle(new Rect(at.x - size - 1.2f, at.y - size - 1.2f, size * 2 + 2.4f, size * 2 + 2.4f), dark);
                Draw.Circle(new Rect(at.x - size, at.y - size, size * 2, size * 2), fill);
                Draw.Circle(new Rect(at.x - size * .55f, at.y - size * .6f, size * .6f, size * .6f), new Color(1, 1, 1, .7f));
            }
        }
        const string BoltSpec = "+P .34 -.98 -.56 .16 .1 .16;+P -.1 -.16 .56 -.16 -.34 .98";
        static readonly Color Volt = new Color(1f, .9f, .2f);
        // Sparks on a ball whose power is switched off: three small bolts on its rim, taking turns.
        static void Sparks(Vector2 point, float edge, float now, int id)
        {
            Color dark = Theme.Shade(Volt, 1.1f, .3f); float size = Mathf.Max(9f, edge * .5f);
            for (int i = 0; i < 3; i++)
            {
                // Each bolt shows for a part of the cycle (all three, still, when the player asked for calm effects).
                if (!Fx.ReducedMotion && Mathf.Repeat(now * 1.6f + i * .34f + id * .13f, 1f) > .62f) continue;
                float angle = (-90f + (i - 1) * 104f) * Mathf.Deg2Rad;
                var at = point + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * edge * .92f;
                var box = new Rect(at.x - size * .5f, at.y - size * .5f, size, size);
                Glyphs.PaintOutline(box, BoltSpec, dark);
                Glyphs.Paint(box, BoltSpec, Volt);
            }
        }
        // The charges a Battery holds: bolts in a row over the ball.
        static void Charges(Vector2 point, float edge, float scale, int charge)
        {
            Color dark = Theme.Shade(Volt, 1.1f, .3f); float size = Mathf.Max(10f, edge * .46f), step = size * .86f;
            for (int i = 0; i < charge; i++)
            {
                var box = new Rect(point.x - size * .5f + (i - (charge - 1) * .5f) * step, point.y - edge - size * .82f, size, size);
                Glyphs.PaintOutline(box, BoltSpec, dark);
                Glyphs.Paint(box, BoltSpec, Volt);
            }
        }
        // A web over a ball that is stuck in one.
        static void Web(Vector2 point, float radius, float scale)
        {
            Color strand = new Color(.8f, 1f, .62f, .92f); float line = Mathf.Max(1.2f, 1.7f * scale);
            for (int i = 0; i < 3; i++)
            {
                float angle = (20f + i * 60f) * Mathf.Deg2Rad; var along = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius * .96f;
                Draw.Stroke(point - along, point + along, strand, line);
            }
            Draw.Ring(point, radius * .52f, strand, line);
            Draw.Ring(point, radius * .9f, strand, line);
        }
        // What the ball is going through right now. W24 (owner direction): states are kept minimal.
        // What a ball carries is told by its small chip under it (symbol and number); on the ball
        // itself only two things show, each as one plain shape: a frozen ball is washed in ice (see
        // Render), a shielded one has a thin ring round it. Plus the short flashes for a hit, a heal
        // and an absorbed hit.
        static void DrawState(Rect body, Vector2 point, BallRuntime ball, float radius, float scale, float now)
        {
            if (ball.shield > 0 || ball.divineShield)
                // The shield is the ball's own outline turned bright: on the ball, not round it.
                Draw.Ring(point, radius + Theme.BallInk * scale, ball.divineShield ? Theme.Status(StatusKind.Divine) : Theme.Shield, Mathf.Max(1.6f, Theme.BallInk * 1.25f * scale));
            float flash = Fx.HitFlash(ball.id, now);
            if (flash > 0) Draw.Circle(body, Alpha(Color.white, .6f * flash));
            float heal = Fx.HealGlow(ball.id, now);
            if (heal > 0) Draw.Circle(body, Alpha(Theme.Heal, .4f * heal));
            float absorb = Fx.AbsorbGlow(ball.id, now);
            if (absorb > 0) Draw.Circle(Expand(body, 5 * scale), Alpha(Theme.Shield, .4f * absorb));
        }

        // Icon when the ball has one, otherwise the W20 letter mark.
        static void DrawIdentity(Rect body, BallDefinition definition, float radius, bool preview, int owner = 0)
        {
            // W24 (owner decision): the Standard ball is plain - an empty ball with no symbol.
            if (Plain(definition)) return;
            string spec = definition == null ? null : BallIcons.Spec(definition.id);
            if (spec != null)
            {
                // One look for every ball: a large white symbol straight on the sphere, with a bold
                // edge in a dark tone of the owner's colour and a short drop under it, so it stands
                // off the ball and stays sharp on the lit and the shaded side.
                float half = radius * Theme.IconSize * .5f, drop = Mathf.Max(.8f, radius * .075f);
                var box = new Rect(body.center.x - half, body.center.y - half, half * 2, half * 2);
                Color dark = Theme.Shade(Draw.Owner(owner), 1.1f, .22f);
                Glyphs.PaintOutline(new Rect(box.x, box.y + drop, box.width, box.height), spec, Alpha(dark, .9f));
                Glyphs.PaintOutline(box, spec, dark);
                Glyphs.Paint(box, spec, Color.white);
                return;
            }
            string mark = Mark(definition);
            int size = preview ? Mathf.Clamp(Mathf.RoundToInt(body.width * (mark.Length > 2 ? .3f : .36f)), 7, 22) : Mathf.Max(7, Mathf.RoundToInt(radius * (mark.Length > 2 ? .6f : .72f)));
            MarkLabel(body, mark, size, Draw.Owner(owner));
        }

        // Second pass: HP, shield, states, threat and Replay chip around the ball.
        public static void RenderBadges(Rect board, BallRuntime ball, bool replay,float x,float y,int localOwner,UiBox field)
        {
            float scale = board.width / 540f;
            var point = ViewPoint(board,x,y,localOwner);
            var layout = BallBadges.Layout(ball,point.x,point.y,scale,replay,field,localOwner);
            int font = layout.Font;
            Color team = Draw.Owner(ball.owner);

            // W24 (owner direction): fire, chill, frost, poison, a web and a shield are the look of the
            // ball itself (see Render). A round mark on the lower rim is left only for the few states
            // that have no look of their own (a summoned ball, a veteran...), so they are not lost.
            {
                float rim = ball.radius * scale, mark = Mathf.Clamp(rim * .3f, 6.5f, 13f), edge = Mathf.Max(1f, 1.4f * scale);
                if (Theme.ShowHpNumber)
                    Draw.Inked(new Rect(point.x - rim, point.y + rim * .18f, rim * 2, rim * .62f), ball.hp.ToString(), Mathf.Clamp(Mathf.RoundToInt(rim * .46f), 9, 22), Color.white, TextAnchor.MiddleCenter, Mathf.Max(1f, 1.4f * scale));
                int slot = 0;
                foreach (var state in BallBadges.Chips(ball))
                {
                    if (state.Kind == StatusKind.Fire || state.Kind == StatusKind.Ice || state.Kind == StatusKind.Toxin || state.Kind == StatusKind.Frozen || state.Kind == StatusKind.Rooted) continue;
                    if (slot >= 2) break;
                    var at = point + new Vector2(slot == 0 ? -.7071f : .7071f, .7071f) * (rim - mark * .5f); slot++;
                    var disc = new Rect(at.x - mark, at.y - mark, mark * 2, mark * 2);
                    Draw.Circle(Expand(disc, edge), Theme.Ink);
                    Draw.Circle(disc, Theme.StatusFill(state.Kind));
                    float glyph = mark * 1.36f;
                    Glyphs.Paint(new Rect(at.x - glyph * .5f, at.y - glyph * .5f, glyph, glyph), state.Kind, Color.white);
                }
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
            // A catalog orb is not in play: no HP gauge and no owner pip, so its symbol can be larger.
            DrawOrb(body, definition, owner, unit, 1, -1, 0, 0, 0, 0);
            if (definition != null && (body.width >= 24 || body.width >= 12 && BallIcons.Has(definition.id)))
                DrawIdentity(body, definition, InnerRadius(body.width * .5f, false), true, owner);
        }

        // The ball (W24). A glossy sphere in the owner's colour with a bold dark outline and a shadow on
        // the floor. Along its edge the HP gauge in a dark bezel: a dark track with a smooth arc for
        // the HP that is left - white, yellow when hurt, red when critical; what was lost a moment ago
        // flashes. In the middle one white symbol (DrawIdentity). One shared pair of sprites lights
        // every ball from the upper left and gives it its gloss, so every ball reads as the same
        // kind of object. The gauge and the symbol are drawn over the light, flat and sharp - the
        // gloss never lies on them.
        // A catalog orb has no gauge. The Standard ball has no symbol.
        static bool Plain(BallDefinition definition) => definition != null && definition.id == "normal";
        // Radius of the clear face the symbol is sized from: inside the gauge, or nearly the whole
        // ball when there is no gauge.
        static float InnerRadius(float radius, bool gauge) => radius * (gauge ? Theme.LabelShare : .86f);
        // A mark at every 5 HP is drawn only on a ball large enough for it to be a clean line;
        // on a small ball the arc stays whole.
        const float TickFrom = 30f;
        // Light and gloss of a sphere, shared by every ball: `shade` is laid over the ball in a dark
        // colour (deep on the side away from the light, and along the rim), `shine` in white (a
        // broad light spot on the upper left, one crisp crescent of gloss between the symbol and
        // the gauge, and a little light bounced back on the far side).
        const int LightSize = 128;
        static Texture2D shade, shine;
        // 0 below edge0, 1 above edge1, smooth in between (edge0 may be the larger one).
        static float Smooth(float edge0, float edge1, float x) { float t = Mathf.Clamp01((x - edge0) / (edge1 - edge0)); return t * t * (3 - 2 * t); }
        static void BuildLight()
        {
            shade = new Texture2D(LightSize, LightSize, TextureFormat.RGBA32, true) { name = "Core Clash ball shade", filterMode = FilterMode.Trilinear, wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave };
            shine = new Texture2D(LightSize, LightSize, TextureFormat.RGBA32, true) { name = "Core Clash ball shine", filterMode = FilterMode.Trilinear, wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave };
            var dark = new Color[LightSize * LightSize]; var bright = new Color[LightSize * LightSize];
            float pixels = LightSize * .5f;
            for (int y = 0; y < LightSize; y++)
            for (int x = 0; x < LightSize; x++)
            {
                // Texture rows start at the bottom: +ny is up. The light sits at the upper left.
                float nx = (x + .5f - LightSize * .5f) / (LightSize * .5f - 1), ny = (y + .5f - LightSize * .5f) / (LightSize * .5f - 1);
                float distance = Mathf.Sqrt(nx * nx + ny * ny), edge = Mathf.Clamp01((1 - distance) * pixels);
                if (distance > 1.02f) continue;
                float lx = nx + .30f, ly = ny - .34f, away = Mathf.Sqrt(lx * lx + ly * ly) / 1.3f;
                float shadow = Smooth(.35f, 1f, away) * .46f + Mathf.Pow(distance, 6f) * .2f;
                dark[y * LightSize + x] = new Color(1, 1, 1, Mathf.Clamp01(shadow) * edge);
                float spot = Smooth(.75f, 0f, away) * .4f;
                // Angle round the ball in degrees: 0 at the top, negative to the left.
                float angle = Mathf.Atan2(nx, ny) * Mathf.Rad2Deg;
                float along = Mathf.Clamp01(1 - Mathf.Abs(angle + 48f) / 30f);
                float gloss = along <= 0 ? 0 : Mathf.Clamp01((.0425f * Mathf.Sqrt(along) - Mathf.Abs(distance - .7f)) * pixels + .5f) * .9f;
                float far = Mathf.Clamp01(1 - Mathf.Abs(Mathf.DeltaAngle(angle, 135f)) / 40f);
                float bounce = far <= 0 ? 0 : Mathf.Clamp01((.035f * Mathf.Sqrt(far) - Mathf.Abs(distance - .69f)) * pixels + .5f) * .26f;
                bright[y * LightSize + x] = new Color(1, 1, 1, Mathf.Clamp01(Mathf.Max(Mathf.Max(spot, gloss), bounce)) * edge);
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
            Color team = Draw.Owner(owner), dark = Theme.Shade(team, 1.1f, .26f);
            var center = body.center;
            float radius = body.width * .5f, ink = Mathf.Max(1.2f, Theme.BallInk * scale);
            // Shadow on the floor, away from the light.
            Draw.Glow(new Rect(center.x - radius * .94f, center.y + radius * .14f, radius * 2.24f, radius * 1.32f), Alpha(FloorShadow, .42f));
            Draw.Circle(Expand(body, ink), dark);
            Draw.Circle(body, team);
            if (pip != 0) OwnerPip(center, radius + ink * .5f, pip, pipSize, team, dark);
            Color old = GUI.color;
            GUI.color = ShadeTone; Draw.Tex(body, shade);
            GUI.color = Color.white; Draw.Tex(body, shine);
            GUI.color = old;
            if (hp >= 0)
            {
                float outer = radius * Theme.HpOuterShare, width = radius * Theme.HpWidthShare, bezel = Mathf.Max(.8f, radius * .035f);
                Color track = Theme.Shade(team, 1.1f, .18f);
                Draw.Ring(center, outer + bezel, dark, width + bezel * 2);
                Draw.Ring(center, outer, track, width);
                if (hpBefore > hp && lostFade > 0) Draw.Arc(center, outer, Alpha(Theme.Damage, lostFade), width, hpBefore);
                Draw.Arc(center, outer, Theme.Gauge(hp), width, hp);
                // A thin mark at every 5 HP, so the HP can be counted on a ball that is large enough.
                if (radius >= TickFrom) Draw.Ticks(center, outer, track, width, parts, Mathf.Max(1f, radius * .07f));
            }
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
