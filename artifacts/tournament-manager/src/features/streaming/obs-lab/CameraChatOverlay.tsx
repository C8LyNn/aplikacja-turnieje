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

type BridgeMessage = {
  source?: string;

  type?:
    | "message"
    | "delete-message"
    | "delete-messages";

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

  useEffect(() => {
    if (!streamElementsMode) {
      return;
    }

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

        setMessages(
          (current) =>
            [
              ...current,
              {
                name,
                text,
                msgId:
                  msgId ||
                  undefined,
                userId:
                  userId ||
                  undefined,
                color:
                  color ||
                  undefined,
              },
            ].slice(-100),
        );

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
  }, [streamElementsMode]);

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
