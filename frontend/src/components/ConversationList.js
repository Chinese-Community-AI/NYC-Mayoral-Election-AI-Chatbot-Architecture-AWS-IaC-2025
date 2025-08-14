import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  LIST_CONVERSATIONS,
  LIST_RECENT_CONVERSATIONS,
  CREATE_CONVERSATION,
} from "../graphql/operations";
import "./ConversationList.css";

function ConversationList({ onSelect, selectedId }) {
  const [showRecent, setShowRecent] = useState(true);
  const { data, loading, error, refetch } = useQuery(
    showRecent ? LIST_RECENT_CONVERSATIONS : LIST_CONVERSATIONS,
    { variables: { limit: 20 } }
  );
  const [createConversation] = useMutation(CREATE_CONVERSATION);
  const [title, setTitle] = useState("");

  const onCreate = async (e) => {
    e.preventDefault();
    await createConversation({ variables: { title: title || null } });
    setTitle("");
    refetch();
  };
  if (loading) return <div className="conversation-list">Loading...</div>;
  if (error) return <div className="conversation-list">Error</div>;
  return (
    <div className="conversation-list">
      <form onSubmit={onCreate} className="new-conversation-form">
        <input
          placeholder="New conversation title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
      <div style={{ margin: "8px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={showRecent}
            onChange={(e) => setShowRecent(e.target.checked)}
          />
          Show recent first
        </label>
      </div>
      {(data?.listConversations || []).map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect && onSelect(c.id)}
          className={
            "conversation-item" + (selectedId === c.id ? " selected" : "")
          }
        >
          {c.title || c.id}
        </div>
      ))}
    </div>
  );
}

export default ConversationList;
