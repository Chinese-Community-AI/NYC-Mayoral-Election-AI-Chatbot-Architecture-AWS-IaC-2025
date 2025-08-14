import React, { useState } from "react";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";
import ConversationList from "./components/ConversationList";
import ChatInterface from "./components/ChatInterface";
import Login from "./components/Login";
import authService from "./auth/authService";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";

function App() {
  const isAuthed = authService.isLoggedIn();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  return (
    <ApolloProvider client={client}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 320 }}>
                  <ConversationList
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  {selectedConversationId ? (
                    <ChatInterface conversationId={selectedConversationId} />
                  ) : (
                    <div style={{ padding: 16 }}>Select a conversation</div>
                  )}
                </div>
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ApolloProvider>
  );
}

export default App;
