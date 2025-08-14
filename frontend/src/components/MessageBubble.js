import React from "react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className="message-bubble"
      style={{
        maxWidth: 680,
        margin: "8px 0",
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser ? "#e8f0ff" : "#f5f5f5",
        padding: 12,
        borderRadius: 8,
      }}
    >
      {message.content}
    </div>
  );
}

export default MessageBubble;
