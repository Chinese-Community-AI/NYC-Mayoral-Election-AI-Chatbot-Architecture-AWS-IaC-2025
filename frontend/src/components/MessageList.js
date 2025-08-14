import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import MessageBubble from "./MessageBubble";

const MessageList = forwardRef(({ messages, onScroll }, ref) => {
  const messageMapRef = useRef(new Map());
  const [updateCounter, setUpdateCounter] = useState(0);
  const containerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const checkShouldAutoScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      30;
    if (shouldAutoScroll !== isNearBottom) {
      setShouldAutoScroll(isNearBottom);
      if (onScroll) onScroll(isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (!shouldAutoScroll || !containerRef.current) return;
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  };

  useEffect(() => {
    const newMap = new Map();
    messages.forEach((m) => {
      if (!m || !m.id) return;
      newMap.set(m.id, m);
    });
    const currentIds = Array.from(messageMapRef.current.keys()).join(",");
    const newIds = messages
      .filter((m) => m && m.id)
      .map((m) => m.id)
      .join(",");
    messageMapRef.current = newMap;
    if (currentIds !== newIds) setUpdateCounter((p) => p + 1);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkShouldAutoScroll);
      checkShouldAutoScroll();
      return () =>
        container.removeEventListener("scroll", checkShouldAutoScroll);
    }
  }, []);

  useImperativeHandle(ref, () => ({ scrollToBottom, checkShouldAutoScroll }));

  const validMessages = messages.filter((m) => m && m.id);

  return (
    <div
      className="messages-container"
      ref={containerRef}
      key={`message-list-${updateCounter}`}
    >
      {validMessages.length === 0 ? (
        <div className="empty-chat">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="messages">
          {validMessages.map((message) => (
            <MessageBubble
              key={`${message.id}-${message.content?.length || 0}-${
                message.isComplete ? "complete" : "incomplete"
              }`}
              message={message}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default React.memo(MessageList);
