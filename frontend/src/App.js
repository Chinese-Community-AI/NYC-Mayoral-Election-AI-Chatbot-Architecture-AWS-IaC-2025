import React from "react";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";

function App() {
  return (
    <ApolloProvider client={client}>
      NYC Mayoral Election AI Chatbot
    </ApolloProvider>
  );
}

export default App;
