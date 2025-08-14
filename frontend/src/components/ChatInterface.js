import React, { useState } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GET_MESSAGES,
  SEND_MESSAGE,
  ON_MESSAGE_UPDATE,
  ON_NEW_MESSAGE,
} from "../graphql/operations";
import MessageList from "./MessageList";

function ChatInterface({ conversationId }) {
  const [text, setText] = useState("");
  const { data, loading, refetch } = useQuery(GET_MESSAGES, {
    variables: { conversationId },
    skip: !conversationId,
  });
  const [sendMessage] = useMutation(SEND_MESSAGE);

  // Subscriptions (best-effort; non-blocking)
  useSubscription(ON_NEW_MESSAGE, {
    variables: { conversationId },
    skip: !conversationId,
    onData: () => {
      refetch();
    },
  });
  useSubscription(ON_MESSAGE_UPDATE, {
    variables: { conversationId },
    skip: !conversationId,
    onData: () => {
      refetch();
    },
  });

  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ variables: { conversationId, content: text } });
    // Refresh messages to pick up placeholder and later updates
    refetch();
    setText("");
  };

  const messages = data?.getMessages || [];

  return (
    <div className="chat-interface">
      {loading ? <div>Loading...</div> : <MessageList messages={messages} />}
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
