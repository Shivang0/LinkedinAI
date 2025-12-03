import type { CommentTone, CommentStyle, CommentLength } from '../constants';

// Message types for communication between content script and background
export type MessageType =
  | 'GENERATE_COMMENT'
  | 'CHECK_AUTH'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REFRESH_TOKEN'
  | 'GET_USER_INFO';

// Base message interface
export interface BaseMessage<T extends MessageType, P = void> {
  type: T;
  payload: P;
}

// Generate comment message
export interface GenerateCommentPayload {
  postContent: string;
  postAuthor: string;
  postAuthorHeadline?: string;
  tone: CommentTone;
  style: CommentStyle;
  length: CommentLength;
}

export type GenerateCommentMessage = BaseMessage<'GENERATE_COMMENT', GenerateCommentPayload>;

// Auth messages
export type CheckAuthMessage = BaseMessage<'CHECK_AUTH'>;
export type LoginMessage = BaseMessage<'LOGIN'>;
export type LogoutMessage = BaseMessage<'LOGOUT'>;
export type RefreshTokenMessage = BaseMessage<'REFRESH_TOKEN'>;
export type GetUserInfoMessage = BaseMessage<'GET_USER_INFO'>;

// Union of all message types
export type ExtensionMessage =
  | GenerateCommentMessage
  | CheckAuthMessage
  | LoginMessage
  | LogoutMessage
  | RefreshTokenMessage
  | GetUserInfoMessage;

// Response types
export interface GenerateCommentResponse {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  error?: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
  };
  error?: string;
}

export interface UserInfoResponse {
  success: boolean;
  user?: {
    name: string;
    email: string;
    accountStatus: string;
  };
  error?: string;
}

export interface SimpleResponse {
  success: boolean;
  error?: string;
}

// LinkedIn post context (extracted from DOM)
export interface LinkedInPostContext {
  urn: string;
  content: string;
  author: string;
  authorHeadline?: string;
}

// Type-safe message sender
export function sendMessage<T extends ExtensionMessage>(
  message: T
): Promise<
  T extends GenerateCommentMessage ? GenerateCommentResponse :
  T extends CheckAuthMessage ? AuthResponse :
  T extends GetUserInfoMessage ? UserInfoResponse :
  SimpleResponse
> {
  return chrome.runtime.sendMessage(message);
}
