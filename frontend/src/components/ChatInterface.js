import React, { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useMutation,
  useSubscription,
  useApolloClient,
} from "@apollo/client";
import {
  GET_MESSAGES,
  SEND_MESSAGE,
  ON_NEW_MESSAGE,
  ON_MESSAGE_UPDATE,
} from "../graphql/operations";
import MessageList from "./MessageList";
import "./ChatInterface.css";

function ChatInterface({ conversation }) {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const client = useApolloClient();

  const previousConversationIdRef = useRef(conversation?.id);

  useEffect(() => {
    if (previousConversationIdRef.current !== conversation.id) {
      setMessages([]);
      try {
        const currentData = client.cache.readQuery({
          query: GET_MESSAGES,
          variables: { conversationId: conversation.id },
        });
        if (currentData) {
          const serverMessages = currentData.getMessages.filter(
            (msg) =>
              msg &&
              msg.id &&
              !msg.id.startsWith("temp-user-") &&
              !msg.id.startsWith("placeholder-")
          );
          client.cache.writeQuery({
            query: GET_MESSAGES,
            variables: { conversationId: conversation.id },
            data: { getMessages: serverMessages },
          });
        }
      } catch {}
      previousConversationIdRef.current = conversation.id;
    }
  }, [conversation.id, client.cache]);

  const { loading, error, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { conversationId: conversation.id },
    fetchPolicy: "cache-and-network",
  });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setIsSending(false);
      const now = Date.now();
      const placeholderMessage = {
        id: `placeholder-${now}`,
        conversationId: conversation.id,
        content: "...",
        role: "assistant",
        timestamp: new Date().toISOString(),
        isComplete: false,
        createdAt: now,
      };
      try {
        const cache = client.cache;
        const currentData = cache.readQuery({
          query: GET_MESSAGES,
          variables: { conversationId: conversation.id },
        });
        const getMessages = currentData?.getMessages || [];
        const placeholderExists = getMessages.some(
          (msg) =>
            msg.role === "assistant" && msg.content === "..." && !msg.isComplete
        );
        if (!placeholderExists) {
          const updatedMessages = [...getMessages, placeholderMessage];
          cache.writeQuery({
            query: GET_MESSAGES,
            variables: { conversationId: conversation.id },
            data: { getMessages: updatedMessages },
          });
          setMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => map.set(m.id, m));
            map.set(placeholderMessage.id, placeholderMessage);
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
          });
        }
      } catch {}
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      setIsSending(false);
    },
  });

  useSubscription(ON_NEW_MESSAGE, {
    variables: { conversationId: conversation.id },
    onSubscriptionData: ({ subscriptionData, client }) => {
      const newMessage = subscriptionData.data.onNewMessage;
      if (newMessage.role === "assistant") {
        try {
          const currentData = client.readQuery({
            query: GET_MESSAGES,
            variables: { conversationId: conversation.id },
          });
          const getMessages = currentData?.getMessages || [];
          const messageExists = getMessages.some(
            (msg) => msg.id === newMessage.id
          );
          if (!messageExists) {
            const updatedMessages = [...getMessages, newMessage];
            client.writeQuery({
              query: GET_MESSAGES,
              variables: { conversationId: conversation.id },
              data: { getMessages: updatedMessages },
            });
            setMessages((prev) => {
              const map = new Map();
              prev.forEach((m) => map.set(m.id, m));
              map.set(newMessage.id, newMessage);
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );
            });
          }
        } catch {
          refetch();
        }
      }
    },
  });

  useSubscription(ON_MESSAGE_UPDATE, {
    variables: { conversationId: conversation.id },
    onSubscriptionData: ({ subscriptionData, client }) => {
      const update = subscriptionData.data.onMessageUpdate;
      try {
        const currentData = client.readQuery({
          query: GET_MESSAGES,
          variables: { conversationId: conversation.id },
        });
        const getMessages = currentData?.getMessages || [];
        let messageIndex = getMessages.findIndex(
          (msg) => msg.id === update.messageId
        );
        let foundMessage = null;
        if (messageIndex < 0) {
          const now = Date.now();
          const recentPlaceholderIndex = getMessages.findIndex(
            (msg) =>
              msg.role === "assistant" &&
              msg.id.startsWith("placeholder-") &&
              (msg.content === "..." || !msg.isComplete) &&
              msg.createdAt &&
              now - msg.createdAt < 10000
          );
          if (recentPlaceholderIndex >= 0) {
            messageIndex = recentPlaceholderIndex;
            foundMessage = "recent-placeholder";
          } else {
            const messageExists = getMessages.some(
              (msg) => msg.id === update.messageId
            );
            if (!messageExists && update.content && update.content !== "...") {
              const newMessage = {
                id: update.messageId,
                conversationId: conversation.id,
                content: update.content,
                role: "assistant",
                timestamp: update.timestamp || new Date().toISOString(),
                isComplete: update.isComplete,
                __typename: "Message",
              };
              const updatedMessages = [...getMessages, newMessage];
              client.writeQuery({
                query: GET_MESSAGES,
                variables: { conversationId: conversation.id },
                data: { getMessages: updatedMessages },
              });
              setMessages((prev) => {
                const map = new Map();
                prev.forEach((m) => map.set(m.id, m));
                map.set(newMessage.id, newMessage);
                return Array.from(map.values()).sort(
                  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );
              });
              return;
            }
          }
          const contentIndex = getMessages.findIndex(
            (msg) =>
              msg.role === "assistant" &&
              (msg.content === "..." ||
                (update.content &&
                  msg.content.startsWith(update.content.substring(0, 10))))
          );
          if (contentIndex >= 0) {
            messageIndex = contentIndex;
            foundMessage = "by-content";
          } else {
            const assistantMessages = getMessages.filter(
              (msg) => msg.role === "assistant"
            );
            if (assistantMessages.length > 0) {
              const lastAssistantMsg =
                assistantMessages[assistantMessages.length - 1];
              messageIndex = getMessages.findIndex(
                (msg) => msg.id === lastAssistantMsg.id
              );
              foundMessage = "last-assistant";
            }
          }
        } else {
          foundMessage = "by-id";
        }

        if (messageIndex >= 0) {
          const updatedMessages = [...getMessages];
          const originalMessage = updatedMessages[messageIndex];
          const updatedMessage = {
            ...originalMessage,
            id: update.messageId,
            content: update.content,
            isComplete: update.isComplete,
            __typename: originalMessage.__typename || "Message",
            _lastUpdated: Date.now(),
          };
          let newMessages = [...getMessages];
          newMessages[messageIndex] = updatedMessage;
          const uniqueMessages = newMessages.filter((msg, idx, self) => {
            if (!msg || !msg.id) return false;
            if (msg.id.startsWith("placeholder-")) {
              const hasCompleteMessage = self.some(
                (m) =>
                  m &&
                  m.id &&
                  !m.id.startsWith("placeholder-") &&
                  m.role === "assistant" &&
                  (m.id === update.messageId ||
                    (update.isComplete &&
                      m.content &&
                      msg.content &&
                      m.content.includes(msg.content.replace("...", ""))))
              );
              if (hasCompleteMessage) return false;
            }
            return idx === self.findIndex((m) => m && m.id && m.id === msg.id);
          });
          client.writeQuery({
            query: GET_MESSAGES,
            variables: { conversationId: conversation.id },
            data: { getMessages: uniqueMessages },
          });
          setMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => {
              if (
                m.id.startsWith("placeholder-") &&
                uniqueMessages.some(
                  (x) => x.role === "assistant" && x.isComplete
                )
              )
                return;
              map.set(m.id, m);
            });
            uniqueMessages.forEach((m) => map.set(m.id, m));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
          });
          setIsSending(false);
        } else {
          refetch();
        }
      } catch {
        refetch();
      }
    },
  });

  const checkShouldAutoScroll = () => {
    const container = document.querySelector(".messages-container");
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        30;
      return isNearBottom;
    }
    return true;
  };

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollToBottom?.(), 50);
  }, [data, messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;
    setIsSending(true);
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      conversationId: conversation.id,
      content: messageInput,
      role: "user",
      timestamp: new Date().toISOString(),
      isComplete: true,
    };
    setMessages((prev) => {
      const map = new Map();
      prev.forEach((m) => map.set(m.id, m));
      map.set(tempUserMessage.id, tempUserMessage);
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    });
    const sentMessageContent = messageInput;
    setMessageInput("");
    sendMessage({
      variables: {
        conversationId: conversation.id,
        content: sentMessageContent,
      },
    });
  };

  useEffect(() => {
    if (data?.getMessages) {
      const validMessages = data.getMessages.filter((msg) => msg && msg.id);
      setMessages((prevMessages) => {
        const validPrevMessages = prevMessages.filter((msg) => msg && msg.id);
        const messageMap = new Map();
        const tempUserMessageMap = new Map();
        validPrevMessages.forEach((msg) => {
          if (msg.id.startsWith("temp-user-")) {
            const timeKey = Math.floor(
              new Date(msg.timestamp).getTime() / 5000
            );
            const contentKey = msg.content.trim();
            tempUserMessageMap.set(`${contentKey}-${timeKey}`, msg.id);
          }
        });
        prevMessages.forEach((msg) => {
          if (!msg || !msg.id) return;
          if (msg.id.startsWith("temp-user-")) {
            const timeKey = Math.floor(
              new Date(msg.timestamp).getTime() / 5000
            );
            const contentKey = msg.content ? msg.content.trim() : "";
            const mapKey = `${contentKey}-${timeKey}`;
            const hasServerVersion = data.getMessages.some(
              (serverMsg) =>
                serverMsg &&
                serverMsg.role === "user" &&
                serverMsg.content &&
                serverMsg.content.trim() === contentKey &&
                Math.abs(
                  new Date(serverMsg.timestamp).getTime() -
                    new Date(msg.timestamp).getTime()
                ) < 10000
            );
            if (!hasServerVersion) {
              messageMap.set(msg.id, msg);
            }
          } else if (!msg.id.startsWith("placeholder-")) {
            messageMap.set(msg.id, msg);
          }
        });
        validMessages.forEach((msg) => {
          messageMap.set(msg.id, msg);
          if (msg && msg.role === "user" && msg.content) {
            const timeKey = Math.floor(
              new Date(msg.timestamp).getTime() / 5000
            );
            const contentKey = msg.content.trim();
            const mapKey = `${contentKey}-${timeKey}`;
            if (tempUserMessageMap.has(mapKey)) {
              const tempId = tempUserMessageMap.get(mapKey);
              if (messageMap.has(tempId)) {
                messageMap.delete(tempId);
              }
            }
          }
        });
        return Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
    }
  }, [data]);

  if (loading) return <div className="loading">Loading messages...</div>;
  if (error)
    return <div className="error">Error loading messages: {error.message}</div>;

  return (
    <div className="chat-interface" key={`chat-${conversation.id}`}>
      <div className="chat-header">
        <h2>{conversation.title || "Untitled Conversation"}</h2>
      </div>
      <MessageList
        messages={messages}
        onScroll={() => {}}
        ref={messagesEndRef}
      />
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !messageInput.trim()}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
