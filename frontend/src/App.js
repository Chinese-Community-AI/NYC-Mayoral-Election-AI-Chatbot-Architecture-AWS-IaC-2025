import React, { useState, useRef } from "react";
import { ApolloProvider, useApolloClient } from "@apollo/client";
import client from "./graphql/client";
import ConversationList from "./components/ConversationList";
import ChatInterface from "./components/ChatInterface";
import Login from "./components/Login";
import authService from "./auth/authService";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PrivateRoute from "./auth/PrivateRoute";
import "./index.css";
import "./App.css";

function Dashboard() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const apolloClient = useApolloClient();
  const previousConversationRef = useRef(null);

  const handleSelectConversation = (conversation) => {
    if (
      previousConversationRef.current &&
      previousConversationRef.current.id !== conversation.id
    ) {
      setSelectedConversation(conversation);
      previousConversationRef.current = conversation;
    } else {
      setSelectedConversation(conversation);
      previousConversationRef.current = conversation;
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AWS GenAI Chatbot</h1>
        <div className="user-info">
          <span>Welcome, {authService.getUsername()}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      <div className="app-container">
        <div className="sidebar">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        </div>
        <div className="main-content">
          {selectedConversation ? (
            <ChatInterface
              key={`chat-interface-${selectedConversation.id}`}
              conversation={selectedConversation}
            />
          ) : (
            <div className="empty-state">
              <p>Select a conversation or create a new one to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/conversations" replace />} />
          <Route element={<PrivateRoute />}>
            <Route path="/conversations" element={<Dashboard />} />
            <Route path="/conversations/:id" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </ApolloProvider>
  );
}

export default App;
