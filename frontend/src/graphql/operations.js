import { gql } from "@apollo/client";

export const LIST_CONVERSATIONS = gql`
  query ListConversations {
    listConversations {
      id
      userId
      title
      createdAt
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!) {
    getMessages(conversationId: $conversationId) {
      id
      conversationId
      content
      role
      timestamp
      isComplete
    }
  }
`;
