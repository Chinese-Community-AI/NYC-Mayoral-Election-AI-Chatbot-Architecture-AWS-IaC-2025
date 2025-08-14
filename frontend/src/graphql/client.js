import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { ApolloLink } from "apollo-link";
import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import config from "../config";
import authService from "../auth/authService";

const httpLink = createHttpLink({
  uri: config.appSync.graphqlEndpoint,
});

const jwtAuthLink = setContext((_, { headers }) => {
  const token = authService.getToken && authService.getToken();

  const authHeaders = {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };

  return authHeaders;
});

const apiKeyAuthLink = createAuthLink({
  url: config.appSync.graphqlEndpoint,
  region: config.appSync.region,
  auth: {
    type: "API_KEY",
    apiKey: config.appSync.apiKey,
  },
});

const subscriptionLink = createSubscriptionHandshakeLink({
  url: config.appSync.graphqlEndpoint,
  region: config.appSync.region,
  auth: {
    type: "AWS_LAMBDA",
    token: () => {
      const token = authService.getToken && authService.getToken();
      return token ? `Bearer ${token}` : "";
    },
  },
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      // eslint-disable-next-line no-console
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`[Network error]:`, networkError);
  }
});

const link = ApolloLink.from([
  errorLink,
  jwtAuthLink,
  ApolloLink.split(
    (operation) => {
      const operationType = operation.query.definitions[0].operation;
      return operationType === "subscription";
    },
    subscriptionLink,
    httpLink
  ),
]);

const client = new ApolloClient({
  link,
  connectToDevTools: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getMessages: {
            keyArgs: ["conversationId"],
          },
        },
      },
    },
  }),
});

export default client;
