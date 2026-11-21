import { t } from "@/i18n";
import type { CSSProperties } from "react";
import { SKETCH_FONT, sketchStages, type SketchBox, type SketchStageInput } from "@/lib/format-sketch";

/** #323-C · shared by the Modern preview panel and the Classic quick-preset summary. Colours follow the host theme. */
const BOX_STYLE: Record<SketchBox["kind"], { fill: string; fillOpacity?: number; stroke?: string; strokeOpacity?: number; strokeWidth?: number; dash?: string; rx: number }> = {
  match: { fill: "currentColor", fillOpacity: 0.07, stroke: "currentColor", strokeOpacity: 0.5, rx: 3 },
  bye: { fill: "none", stroke: "currentColor", strokeOpacity: 0.35, dash: "3 2", rx: 3 },
  final: { fill: "var(--sketch-accent, currentColor)", fillOpacity: 0.22, stroke: "var(--sketch-accent, currentColor)", strokeWidth: 1.6, rx: 3 },
  group: { fill: "currentColor", fillOpacity: 0.04, stroke: "currentColor", strokeOpacity: 0.3, rx: 6 },
  bucket: { fill: "currentColor", fillOpacity: 0.07, stroke: "currentColor", strokeOpacity: 0.4, rx: 3 },
  cell: { fill: "currentColor", fillOpacity: 0.16, rx: 2 },
  self: { fill: "none", stroke: "currentColor", strokeOpacity: 0.15, rx: 2 },
  seat: { fill: "currentColor", fillOpacity: 0.28, rx: 4.5 },
  qualifier: { fill: "var(--sketch-accent, currentColor)", rx: 4.5 },
};

const captionStyle: CSSProperties = { margin: "0.25rem 0 0", fontSize: "0.75rem", lineHeight: 1.4, opacity: 0.8 };

export function FormatSketch({
  stages,
  accent,
  captions = true,
  className,
}: {
  stages: readonly (SketchStageInput & { advancementText?: string })[];
  /** CSS colour of finals and qualifiers, e.g. a theme variable. */
  accent: string;
  captions?: boolean;
  className?: string;
}) {
  const sketches = sketchStages(stages);
  if (sketches.length === 0) return null;
  return (
    <figure
      className={className}
      data-testid="format-sketch"
      aria-label={t("formatSketch.szkic_ukladu_turnieju")}
      style={{ margin: 0, display: "grid", gap: "0.75rem", ["--sketch-accent" as string]: accent }}
    >
      {sketches.map((sketch, index) => {
        const stage = stages.find((item) => item.key === sketch.key);
        return (
          <div key={sketch.key} data-testid="format-sketch-stage" data-format={sketch.format} style={{ minWidth: 0 }}>
            {sketches.length > 1 && (
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: 700 }}>{index + 1}. {stage?.name}</p>
            )}
            <svg
              viewBox={`0 0 ${sketch.width} ${sketch.height}`}
              role="img"
              aria-label={sketch.summary}
              style={{ display: "block", width: "100%", maxWidth: "22rem", height: "auto", overflow: "visible" }}
            >
              {sketch.paths.map((d, i) => (
                <path key={`p${i}`} d={d} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
              ))}
              {sketch.boxes.map((box, i) => {
                const style = BOX_STYLE[box.kind];
                return (
                  <g key={`b${i}`} data-kind={box.kind}>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={Math.max(0, box.w)}
                      height={Math.max(0, box.h)}
                      rx={style.rx}
                      fill={style.fill}
                      fillOpacity={style.fillOpacity}
                      stroke={style.stroke}
                      strokeOpacity={style.strokeOpacity}
                      strokeWidth={style.strokeWidth ?? 1}
                      strokeDasharray={style.dash}
                    />
                    {box.label && (
                      <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 3.5} textAnchor="middle" fontSize={SKETCH_FONT.label} fill="currentColor">
                        {box.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {sketch.texts.map((text, i) => (
                <text key={`t${i}`} x={text.x} y={text.y} textAnchor={text.anchor} fontSize={SKETCH_FONT.header} fontWeight={600} fill="currentColor" fillOpacity={0.75}>
                  {text.text}
                </text>
              ))}
            </svg>
            {captions && <p style={captionStyle} data-testid="format-sketch-caption">{sketch.summary}</p>}
            {sketch.note && <p style={{ ...captionStyle, fontStyle: "italic" }}>{sketch.note}</p>}
            {index < sketches.length - 1 && stage?.advancementText && (
              <p style={{ ...captionStyle, fontWeight: 600 }} aria-hidden="true">↓ {stage.advancementText}</p>
            )}
          </div>
        );
      })}
    </figure>
  );
}
