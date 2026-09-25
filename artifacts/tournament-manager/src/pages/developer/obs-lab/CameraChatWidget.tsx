import type { CSSProperties } from "react";

import {
  type CameraChatConfig,
  getCameraChatSize,
} from "./camera-chat-settings";

export type MockChatMessage = {
  name: string;
  text: string;

  msgId?: string;
  userId?: string;

  color?: string;
};

const RANDOM_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

const NAME_COLORS = [
  "text-rose-400",
  "text-emerald-400",
  "text-violet-400",
  "text-sky-400",
  "text-amber-400",
  "text-cyan-400",
];

function randomInt(
  min: number,
  max: number,
) {
  return (
    Math.floor(
      Math.random() *
        (max - min + 1),
    ) + min
  );
}

function randomString(
  minLength: number,
  maxLength: number,
) {
  const length = randomInt(
    minLength,
    maxLength,
  );

  let result = "";

  for (
    let i = 0;
    i < length;
    i++
  ) {
    result +=
      RANDOM_CHARS[
        randomInt(
          0,
          RANDOM_CHARS.length - 1,
        )
      ];
  }

  return result;
}

export function generateMockMessages(
  count = 30,
): MockChatMessage[] {
  return Array.from(
    { length: count },
    () => ({
      name: randomString(4, 13),

      text: Array.from(
        {
          length: randomInt(2, 8),
        },
        () =>
          randomString(2, 10),
      ).join(" "),
    }),
  );
}

type Props = {
  config: CameraChatConfig;
  messages: MockChatMessage[];
  previewCamera?: boolean;
};

export function CameraChatWidget({
  config,
  messages,
  previewCamera = false,
}: Props) {
  const size =
    getCameraChatSize(config);

  const visibleMessages =
    messages.slice(
      -config.maxMessages,
    );

  const fontClass =
    config.fontSize === "small"
      ? "text-xs"
      : config.fontSize === "large"
        ? "text-base"
        : "text-sm";

  const messagePadding =
    config.density === "compact"
      ? "px-2.5 py-1.5"
      : config.density === "relaxed"
        ? "px-4 py-3"
        : "px-3 py-2";

  const messageGap =
    config.density === "compact"
      ? "space-y-1"
      : config.density === "relaxed"
        ? "space-y-4"
        : "space-y-2";

  const renderMessages = (
    forceHeight?: number | string,
  ) => (
    <div
      className={`flex min-h-0 w-full flex-col overflow-hidden ${
        config.chatAnchor === "top"
          ? "justify-start"
          : "justify-end"
      }`}
      style={{
        height: forceHeight,
        backgroundColor:
          `rgba(2, 6, 23, ${
            config.panelOpacity / 100
          })`,
      }}
    >
      <div
        className={messageGap}
        style={{
          padding:
            `${config.innerPadding}px`,
        }}
      >
        {visibleMessages.map(
          (message, index) => {
            const opacity =
              config.fadeOldMessages
                ? 0.5 +
                  ((index + 1) /
                    visibleMessages.length) *
                    0.5
                : 1;

            return (
              <div
                key={
                  message.msgId ??
                  (
                    message.name +
                    message.text +
                    index
                  )
                }
                className={[
                  "flex min-w-0 items-start gap-2",
                  config.messageBackground
                    ? "rounded-xl bg-white/[0.055]"
                    : "",
                  config.showBorders
                    ? "border border-white/[0.07]"
                    : "",
                  messagePadding,
                ].join(" ")}
                style={{
                  opacity,
                  animation:
                    config.animateMessages
                      ? "obs-chat-in 220ms ease-out both"
                      : undefined,
                }}
              >
                {config.showAvatars && (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-black text-white/70">
                    {message.name[0]}
                  </div>
                )}

                <div
                  className={`min-w-0 leading-5 ${fontClass}`}
                >
                  <span
                    style={
                      message.color
                        ? {
                            color:
                              message.color,
                          }
                        : undefined
                    }
                    className={`mr-2 font-black ${
                      NAME_COLORS[
                        index %
                          NAME_COLORS.length
                      ]
                    }`}
                  >
                    {message.name}
                  </span>

                  <span className="break-all text-white/85">
                    {message.text}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );

  const cameraClass =
    previewCamera
      ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
      : "bg-transparent";

  const camera = (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        cameraClass,
      ].join(" ")}
      style={{
        width:
          `${config.cameraWidth}px`,
        height:
          `${size.cameraHeight}px`,
      }}
    >
      {previewCamera && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.08),transparent_45%)]" />

          <div className="relative text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-black/20 text-xs font-black tracking-[0.15em] text-white/40">
              CAM
            </div>

            <div className="mt-3 text-sm font-bold text-white/55">
              {config.cameraWidth}
              {" × "}
              {size.cameraHeight}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const overlayPositionStyle:
    CSSProperties = {
      ...(config.overlayPosition.includes(
        "top",
      )
        ? {
            top:
              config.overlayInset,
          }
        : {
            bottom:
              config.overlayInset,
          }),

      ...(config.overlayPosition.includes(
        "left",
      )
        ? {
            left:
              config.overlayInset,
          }
        : {
            right:
              config.overlayInset,
          }),
    };

  return (
    <>
      <style>
        {`
          @keyframes obs-chat-in {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        className={[
          "relative shrink-0 overflow-hidden",
          config.showBorders
            ? "border border-white/10"
            : "",
        ].join(" ")}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          borderRadius:
            `${config.radius}px`,
        }}
      >
        {config.layout === "right" && (
          <div
            className="flex h-full"
            style={{
              gap:
                `${config.gap}px`,
            }}
          >
            {camera}

            <div
              className="flex shrink-0 overflow-hidden"
              style={{
                width:
                  `${size.chatWidthPx}px`,
                height:
                  `${size.cameraHeight}px`,
                alignItems:
                  config.chatAnchor ===
                  "top"
                    ? "flex-start"
                    : "flex-end",
              }}
            >
              {renderMessages(
                config.fitChatHeight
                  ? "100%"
                  : undefined,
              )}
            </div>
          </div>
        )}

        {config.layout === "below" && (
          <div
            className="flex h-full flex-col"
            style={{
              gap:
                `${config.gap}px`,
            }}
          >
            {camera}

            <div
              className="shrink-0 overflow-hidden"
              style={{
                height:
                  `${config.belowHeight}px`,
              }}
            >
              {renderMessages("100%")}
            </div>
          </div>
        )}

        {config.layout === "overlay" && (
          <>
            {camera}

            <div
              className="absolute overflow-hidden"
              style={{
                width:
                  `${config.chatWidth}%`,
                maxHeight:
                  `${
                    size.cameraHeight -
                    config.overlayInset * 2
                  }px`,
                borderRadius:
                  `${Math.max(
                    6,
                    config.radius * 0.7,
                  )}px`,
                ...overlayPositionStyle,
              }}
            >
              {renderMessages()}
            </div>
          </>
        )}
      </div>
    </>
  );
}
