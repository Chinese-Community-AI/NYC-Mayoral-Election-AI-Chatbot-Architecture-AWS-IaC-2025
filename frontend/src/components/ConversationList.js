import React from "react";
import { useQuery } from "@apollo/client";
import { LIST_CONVERSATIONS } from "../graphql/operations";

function ConversationList() {
  const { data, loading, error } = useQuery(LIST_CONVERSATIONS);
  if (loading) return <div className="conversation-list">Loading...</div>;
  if (error) return <div className="conversation-list">Error</div>;
  return (
    <div className="conversation-list">
      {(data?.listConversations || []).map((c) => (
        <div key={c.id}>{c.title || c.id}</div>
      ))}
    </div>
  );
}

export default ConversationList;
