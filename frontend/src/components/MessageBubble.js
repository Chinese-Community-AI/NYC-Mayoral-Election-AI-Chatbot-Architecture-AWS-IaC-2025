import React from "react";
import "./MessageBubble.css";

function MessageBubble({ message }) {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isUserMessage = message.role === "user";
  const isGenerating =
    message.role === "assistant" && message.isComplete === false;
  const isPlaceholder =
    message.role === "assistant" &&
    message.content === "..." &&
    message.id &&
    message.id.startsWith("placeholder-");

  if (isPlaceholder) return null;
  if (!message || !message.content) return null;

  return (
    <div
      className={`message-bubble ${
        isUserMessage ? "user-message" : "assistant-message"
      }`}
      data-message-id={message.id}
      data-content-length={message.content ? message.content.length : 0}
      data-is-placeholder={isPlaceholder ? "true" : "false"}
    >
      <div className="message-content">
        {message.content}
        {isGenerating && (
          <span className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        )}
      </div>
      <div className="message-timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
}

export default React.memo(MessageBubble, (prevProps, nextProps) => {
  if (!prevProps.message || !nextProps.message) return false;
  const prevContent = prevProps.message.content || "";
  const nextContent = nextProps.message.content || "";
  const contentChanged = prevContent !== nextContent;
  const prevComplete = prevProps.message.isComplete;
  const nextComplete = nextProps.message.isComplete;
  const completeChanged = prevComplete !== nextComplete;
  if (contentChanged || completeChanged) return false;
  return true;
});
