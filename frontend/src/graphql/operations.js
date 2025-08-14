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

export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($title: String) {
    createConversation(title: $title) {
      id
      userId
      title
      createdAt
      updatedAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!) {
    sendMessage(conversationId: $conversationId, content: $content) {
      id
      conversationId
      content
      role
      timestamp
      isComplete
    }
  }
`;
