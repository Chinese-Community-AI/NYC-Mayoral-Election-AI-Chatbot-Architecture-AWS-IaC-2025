import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MESSAGES, SEND_MESSAGE } from "../graphql/operations";

function ChatInterface({ conversationId }) {
  const [text, setText] = useState("");
  const { data, loading } = useQuery(GET_MESSAGES, {
    variables: { conversationId },
    skip: !conversationId,
  });
  const [sendMessage] = useMutation(SEND_MESSAGE);

  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ variables: { conversationId, content: text } });
    setText("");
  };

  const messages = data?.getMessages || [];

  return (
    <div className="chat-interface">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="messages-container">
          {messages.map((m) => (
            <div key={m.id} className={`message-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={onSend}>
        <input
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatInterface;
