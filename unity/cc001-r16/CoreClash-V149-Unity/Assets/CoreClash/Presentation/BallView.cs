using System.Collections.Generic;
using System.Linq;
using CoreClash.Core;
using CoreClash.Data;
using UnityEngine;

namespace CoreClash.Presentation
{
    public static class BallView
    {
        const int SpriteSize = 96;
        static readonly Dictionary<string, Texture2D> BodySprites = new Dictionary<string, Texture2D>();
        static readonly Dictionary<int, Texture2D> RingSprites = new Dictionary<int, Texture2D>();
        static BallIdentity identity;
        public static void SetIdentity(BallIdentity value){identity=value;}
        static string Mark(BallDefinition definition)=>definition==null?"?":identity?.Mark(definition.id)??"?";

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay)
            => Render(board,ball,definition,replay,ball.x,ball.y,0);

        public static void Render(Rect board, BallRuntime ball, BallDefinition definition, bool replay,float x,float y,int localOwner=0)
        {
            float scale = board.width / 540f;
            float radius = ball.radius * scale;
            float viewX=MatchPerspective.ViewX(x,localOwner),viewY=MatchPerspective.ViewY(y,localOwner);
            var point = new Vector2(board.x + viewX * scale, board.y + viewY * scale);
            var body = new Rect(point.x - radius, point.y - radius, radius * 2, radius * 2);
            Color team = Draw.Owner(ball.owner);
            Color color = definition == null ? Color.white : Draw.Hex(definition.color);

            DrawWake(point, ball, color, scale,localOwner);
            Draw.Circle(Expand(body, 5 * scale), Alpha(team, replay ? .17f : .07f));
            if (replay)
            {
                float pulse = (5 + Mathf.Sin(Time.unscaledTime * 4 + ball.id) * 1.2f) * scale;
                Ring(point, radius + pulse, Alpha(team, .66f), Mathf.Max(1, 1.5f * scale));
                Ring(point, radius + pulse + 4 * scale, Alpha(team, .13f), Mathf.Max(1, scale));
            }

            Draw.Circle(new Rect(body.x + scale, body.y + 3 * scale, body.width, body.height), new Color(0, 0, 0, .5f));
            Draw.Circle(Expand(body, 2 * scale), Alpha(team, .92f));
            Draw.Circle(Expand(body, .6f * scale), new Color(.035f, .06f, .085f));
            DrawBody(body, definition);

            string mark = Mark(definition);
            int markSize = Mathf.Max(7, Mathf.RoundToInt(9 * scale));
            int hpSize = Mathf.Max(8, Mathf.RoundToInt(11 * scale));
            var markBox = new Rect(point.x - radius, point.y - radius * .68f, radius * 2, radius * .8f);
            var hpBox = new Rect(point.x - radius, point.y - radius * .05f, radius * 2, radius * .95f);
            Label(markBox, mark, markSize, new Color(.96f, .99f, 1, .88f));
            Label(hpBox, ball.hp.ToString(), hpSize, Color.white);

            // Ownership and simultaneous states have non-hue readings separate from identity.
            float ownerW=Mathf.Max(16,18*scale),ownerH=Mathf.Max(10,12*scale);
            var ownerBox=new Rect(point.x+radius*.3f,point.y-radius-ownerH*.7f,ownerW,ownerH);
            Draw.Round(ownerBox,new Color(.018f,.035f,.055f,.94f));
            Label(ownerBox,BallInspection.OwnerMark(ball.owner),Mathf.Max(7,Mathf.RoundToInt(8*scale)),Color.white);
            var statuses=BallInspection.Statuses(ball);int rows=(statuses.Length+1)/2;
            float rowH=Mathf.Max(10,12*scale),statusW=Mathf.Max(54,radius*2+12*scale);
            for(int row=0;row<rows;row++){
                var box=new Rect(point.x-statusW/2,point.y+radius+2*scale+row*rowH,statusW,rowH);
                Draw.Round(box,new Color(.018f,.035f,.055f,.9f));
                Label(box,string.Join("  ",statuses.Skip(row*2).Take(2).Select(s=>s.Code)),Mathf.Max(7,Mathf.RoundToInt(8*scale)),Color.white);
            }
            if (replay)
            {
                float dotY = point.y + radius + rows*rowH + 7*scale;
                Draw.Circle(new Rect(point.x - 2.5f * scale, dotY, 5 * scale, 5 * scale), new Color(.85f, .98f, 1));
            }
        }

        // Shared by the launcher and the card tray: this previews a catalog orb, not a runtime ball.
        public static void Preview(Rect body, BallDefinition definition, int owner, bool selected = false)
        {
            Color team = Draw.Owner(owner);
            float unit = Mathf.Max(.6f, body.width / 36f);
            if (selected)
            {
                Draw.Circle(Expand(body, 8 * unit), Alpha(team, .045f));
                Draw.Circle(Expand(body, 5 * unit), Alpha(team, .09f));
                Draw.Circle(Expand(body, 2.5f * unit), Alpha(team, .26f));
            }
            Draw.Circle(new Rect(body.x + unit, body.y + 2.5f * unit, body.width, body.height), new Color(0, 0, 0, .38f));
            Draw.Circle(Expand(body, 1.5f * unit), Alpha(team, selected ? .95f : .65f));
            Draw.Circle(Expand(body, .35f * unit), new Color(.035f, .06f, .085f));
            DrawBody(body, definition);
            if(body.width>=28&&definition!=null)Draw.Text(body,Mark(definition),Mathf.Clamp(Mathf.RoundToInt(body.width*.22f),8,17),new Color(.94f,.99f,1,.9f),TextAnchor.MiddleCenter,true);
        }

        static void DrawBody(Rect body, BallDefinition definition)
        {
            string key = definition == null || string.IsNullOrEmpty(definition.color) ? "#d8e7f5" : definition.color;
            if (!BodySprites.TryGetValue(key, out var sprite))
            {
                sprite = CreateBodySprite(Draw.Hex(key));
                BodySprites.Add(key, sprite);
            }
            Color old = GUI.color;
            GUI.color = Color.white;
            GUI.DrawTexture(body, sprite);
            GUI.color = old;
        }

        static Texture2D CreateBodySprite(Color color)
        {
            var sprite = new Texture2D(SpriteSize, SpriteSize, TextureFormat.RGBA32, false)
            {
                name = "Core Clash glossy orb",
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp,
                hideFlags = HideFlags.HideAndDontSave
            };
            var pixels = new Color[SpriteSize * SpriteSize];
            for (int y = 0; y < SpriteSize; y++)
            for (int x = 0; x < SpriteSize; x++)
            {
                float nx = (x + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float ny = -(y + .5f - SpriteSize * .5f) / (SpriteSize * .5f - 1);
                float distance = Mathf.Sqrt(nx * nx + ny * ny);
                if (distance > 1.02f) continue;
                float nz = Mathf.Sqrt(Mathf.Max(0, 1 - distance * distance));
                float light = Mathf.Clamp01(-nx * .38f - ny * .48f + nz * .76f);
                Color pixel = Color.Lerp(new Color(.025f, .04f, .075f), color, .27f + light * .73f);
                float highlight = Mathf.Exp(-((nx + .34f) * (nx + .34f) + (ny + .39f) * (ny + .39f)) * 17);
                pixel = Color.Lerp(pixel, Color.white, highlight * .9f);
                pixel.a = Mathf.Clamp01((1 - distance) * SpriteSize * .5f);
                pixels[y * SpriteSize + x] = pixel;
            }
            sprite.SetPixels(pixels);
            sprite.Apply(false, true);
            return sprite;
        }

        static void DrawWake(Vector2 point, BallRuntime ball, Color color, float scale,int localOwner)
        {
            var velocity = localOwner==1?new Vector2(-ball.vx,-ball.vy):new Vector2(ball.vx,ball.vy);
            if (!ball.moving || velocity.sqrMagnitude < 8100) return;
            float length = Mathf.Min(42, velocity.magnitude * .075f) * scale;
            Vector2 direction = velocity.normalized;
            for (int i = 3; i > 0; i--)
            {
                Vector2 start = point - direction * length * (i - 1) / 3;
                Vector2 end = point - direction * length * i / 3;
                Draw.Line(start, end, Alpha(color, .19f - i * .04f), Mathf.Max(1, ball.radius * .4f * scale));
            }
        }

        static void Label(Rect rect, string text, int size, Color color)
        {
            var shadow = new Rect(rect.x, rect.y + 1, rect.width, rect.height);
            Draw.Text(shadow, text, size, new Color(.02f, .04f, .07f, .8f), TextAnchor.MiddleCenter, true);
            Draw.Text(rect, text, size, color, TextAnchor.MiddleCenter, true);
        }

        static void Ring(Vector2 center, float radius, Color color, float width)
        {
            if (radius <= 0) return;
            int key = Mathf.Max(1, Mathf.RoundToInt(width / radius * 2048));
            if (!RingSprites.TryGetValue(key, out var sprite))
            {
                const int size = 128;
                sprite = new Texture2D(size, size, TextureFormat.RGBA32, false)
                {
                    name = "Core Clash orb outline", filterMode = FilterMode.Bilinear,
                    wrapMode = TextureWrapMode.Clamp, hideFlags = HideFlags.HideAndDontSave
                };
                float inner = size * .5f - Mathf.Max(.6f, key / 2048f * size * .5f);
                var pixels = new Color[size * size];
                for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float distance = Vector2.Distance(new Vector2(x + .5f, y + .5f), new Vector2(size * .5f, size * .5f));
                    pixels[y * size + x] = new Color(1, 1, 1, Mathf.Clamp01(size * .5f - distance) * Mathf.Clamp01(distance - inner + 1));
                }
                sprite.SetPixels(pixels);
                sprite.Apply(false, true);
                RingSprites.Add(key, sprite);
            }
            Color old = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(new Rect(center.x - radius, center.y - radius, radius * 2, radius * 2), sprite);
            GUI.color = old;
        }

        static Rect Expand(Rect rect, float amount) => new Rect(rect.x - amount, rect.y - amount, rect.width + amount * 2, rect.height + amount * 2);
        static Color Alpha(Color color, float alpha) => new Color(color.r, color.g, color.b, alpha);
    }
}
