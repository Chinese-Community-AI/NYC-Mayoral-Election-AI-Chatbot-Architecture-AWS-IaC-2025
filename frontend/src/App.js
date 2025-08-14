import React from "react";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";
import ConversationList from "./components/ConversationList";

function App() {
  return (
    <ApolloProvider client={client}>
      <ConversationList />
    </ApolloProvider>
  );
}

export default App;
