import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { LIST_CONVERSATIONS, CREATE_CONVERSATION } from "../graphql/operations";

function ConversationList({ onSelect, selectedId }) {
  const { data, loading, error, refetch } = useQuery(LIST_CONVERSATIONS);
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
      <form onSubmit={onCreate}>
        <input
          placeholder="New conversation title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
      {(data?.listConversations || []).map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect && onSelect(c.id)}
          style={{
            cursor: "pointer",
            padding: 8,
            background: selectedId === c.id ? "#eef" : "transparent",
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          {c.title || c.id}
        </div>
      ))}
    </div>
  );
}

export default ConversationList;
