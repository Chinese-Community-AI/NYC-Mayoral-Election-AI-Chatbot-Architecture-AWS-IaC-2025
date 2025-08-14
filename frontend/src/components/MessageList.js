import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function MessageList({ messages = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.map((m) => m?.id).join("|")]);

  return (
    <div className="messages-container" ref={containerRef}>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}

export default MessageList;
