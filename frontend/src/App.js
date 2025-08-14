import React from "react";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";
import ConversationList from "./components/ConversationList";
import Login from "./components/Login";
import authService from "./auth/authService";

function App() {
  return (
    <ApolloProvider client={client}>
      {authService.isLoggedIn() ? <ConversationList /> : <Login />}
    </ApolloProvider>
  );
}

export default App;
