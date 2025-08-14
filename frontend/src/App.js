import React from "react";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";
import ConversationList from "./components/ConversationList";
import ChatInterface from "./components/ChatInterface";
import Login from "./components/Login";
import authService from "./auth/authService";

function App() {
  const isAuthed = authService.isLoggedIn();
  return (
    <ApolloProvider client={client}>
      {isAuthed ? (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 320 }}>
            <ConversationList />
          </div>
          <div style={{ flex: 1 }}>
            <ChatInterface conversationId={"placeholder-conversation-id"} />
          </div>
        </div>
      ) : (
        <Login />
      )}
    </ApolloProvider>
  );
}

export default App;
