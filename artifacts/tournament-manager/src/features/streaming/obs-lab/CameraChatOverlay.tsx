import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CameraChatWidget,
  generateMockMessages,
  type MockChatMessage,
} from "./CameraChatWidget";

import {
  cameraChatConfigFromSearch,
} from "./camera-chat-settings";
import {
  chatBadgesFromEvent,
  chatEmotesFromEvent,
  chatFirstMessageFromEvent,
  chatRolesFromEvent,
} from "./chat-message-format";
import {
  chatEventFromStreamElements,
  chatEventShown,
  chatGoalAmount,
  chatPointsFromTags,
  chatReplyFromTags,
} from "./chat-events";
import { createSevenTvCache, withSevenTvEmotes } from "./chat-emote-sources";
import { useChatPacer } from "./use-chat-pacer";

type BridgeMessage = {
  source?: string;

  type?:
    | "message"
    | "delete-message"
    | "delete-messages"
    | "event";

  payload?: Record<
    string,
    unknown
  >;
};

function valueAsString(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

export default function CameraChatOverlay() {
  const params =
    useMemo(
      () =>
        new URLSearchParams(
          window.location.search,
        ),
      [],
    );

  const config =
    useMemo(
      () =>
        cameraChatConfigFromSearch(
          window.location.search,
        ),
      [],
    );

  const streamElementsMode =
    params.get("source") ===
    "streamelements";

  const [
    messages,
    setMessages,
  ] =
    useState<MockChatMessage[]>(
      () =>
        streamElementsMode
          ? []
          : generateMockMessages(),
    );

  // Calm chat: a flood reaches the screen a few messages a second; each message's lifetime starts when it shows.
  const pacer = useChatPacer<MockChatMessage>(config.floodLimit, (message) => {
    setMessages((current) =>
      message.msgId && current.some((shown) => shown.msgId === message.msgId)
        ? current
        : [...current, { ...message, receivedAt: Date.now() }].slice(-100));
  });

  useEffect(() => {
    if (!streamElementsMode) {
      return;
    }

    let nextLocalId = 0;
    // 7TV tells which emotes stack on the previous one and adds unlisted ones (asked once per channel).
    const sevenTv = createSevenTvCache((url, init) => window.fetch(url, init));

    function handleMessage(
      event: MessageEvent,
    ) {
      if (
        event.source !==
        window.parent
      ) {
        return;
      }

      const bridge =
        event.data as BridgeMessage;

      if (
        !bridge ||
        bridge.source !==
          "camera-chat-se"
      ) {
        return;
      }

      const raw =
        bridge.payload ?? {};

      const nested =
        raw["data"];

      const data =
        nested &&
        typeof nested === "object"
          ? nested as Record<
              string,
              unknown
            >
          : raw;

      if (
        bridge.type === "message"
      ) {
        const text =
          valueAsString(
            data["text"],
          );

        if (!text) {
          return;
        }

        const name =
          valueAsString(
            data[
              "displayName"
            ],
          ) ||
          valueAsString(
            data["nick"],
          ) ||
          "user";

        const msgId =
          valueAsString(
            data["msgId"],
          );

        const userId =
          valueAsString(
            data["userId"],
          );

        const color =
          valueAsString(
            data[
              "displayColor"
            ],
          );

        const nick =
          valueAsString(
            data["nick"],
          );

        const localId = `se-${++nextLocalId}`;

        pacer.push(
                {
                  id: localId,
                  name,
                  text,
                  msgId:
                    msgId ||
                    undefined,
                  userId:
                    userId ||
                    undefined,
                  nick:
                    nick ||
                    undefined,
                  color:
                    color ||
                    undefined,
                  badges: chatBadgesFromEvent(data["badges"]),
                  roles: chatRolesFromEvent(data["badges"]),
                  emotes: config.showEmotes
                    ? withSevenTvEmotes(chatEmotesFromEvent(data["emotes"]), text, sevenTv.get(valueAsString(
                      data["tags"] && typeof data["tags"] === "object" ? (data["tags"] as Record<string, unknown>)["room-id"] : "",
                    )))
                    : chatEmotesFromEvent(data["emotes"]),
                  isAction: data["isAction"] === true,
                  firstMessage: chatFirstMessageFromEvent(data["tags"]),
                  pointsMessage: chatPointsFromTags(data["tags"]),
                  reply: chatReplyFromTags(data["tags"]) ?? undefined,
                },
        );

        return;
      }

      // Follows, subs, cheers, raids and tips skip the calm-chat queue.
      if (bridge.type === "event") {
        const intake = chatEventFromStreamElements(
          valueAsString(raw["listener"]),
          raw["event"],
        );

        // Events that get no row still move the goal bar.
        if (!intake || !(chatEventShown(intake.event, config) || chatGoalAmount(intake.event, config.goalKind) > 0)) {
          return;
        }

        const localId = `se-event-${++nextLocalId}`;

        setMessages((current) =>
          intake.id && current.some((message) => message.id === `event-${intake.id}`)
            ? current
            : [
              ...current,
              {
                id: intake.id ? `event-${intake.id}` : localId,
                name: intake.event.name,
                text: intake.text,
                event: intake.event,
                receivedAt: Date.now(),
              },
            ].slice(-100));

        return;
      }

      if (
        bridge.type ===
        "delete-message"
      ) {
        const msgId =
          valueAsString(
            data["msgId"],
          );

        if (!msgId) {
          return;
        }

        pacer.remove((message) => message.msgId === msgId);

        setMessages(
          (current) =>
            current.filter(
              (message) =>
                message.msgId !==
                msgId,
            ),
        );

        return;
      }

      if (
        bridge.type ===
        "delete-messages"
      ) {
        const userId =
          valueAsString(
            data["userId"],
          );

        if (!userId) {
          return;
        }

        pacer.remove((message) => message.userId === userId);

        setMessages(
          (current) =>
            current.filter(
              (message) =>
                message.userId !==
                userId,
            ),
        );
      }
    }

    window.addEventListener(
      "message",
      handleMessage,
    );

    return () => {
      window.removeEventListener(
        "message",
        handleMessage,
      );
    };
  }, [streamElementsMode, pacer, config]);

  useEffect(() => {
    const html =
      document.documentElement;

    const body =
      document.body;

    const root =
      document.getElementById(
        "root",
      );

    const previous = {
      htmlBackground:
        html.style.background,

      bodyBackground:
        body.style.background,

      bodyMargin:
        body.style.margin,

      bodyOverflow:
        body.style.overflow,

      rootBackground:
        root?.style.background ??
        "",
    };

    html.style.background =
      "transparent";

    body.style.background =
      "transparent";

    body.style.margin = "0";

    body.style.overflow =
      "hidden";

    if (root) {
      root.style.background =
        "transparent";
    }

    return () => {
      html.style.background =
        previous.htmlBackground;

      body.style.background =
        previous.bodyBackground;

      body.style.margin =
        previous.bodyMargin;

      body.style.overflow =
        previous.bodyOverflow;

      if (root) {
        root.style.background =
          previous.rootBackground;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        background:
          "transparent",
      }}
    >
      <CameraChatWidget
        config={config}
        messages={messages}
      />
    </div>
  );
}
