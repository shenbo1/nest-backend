/**
 * Dify API 响应类型定义
 */

// 聊天消息响应
export interface ChatMessageResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata?: Record<string, any>;
  created_at: number;
}

// 流式事件类型
export interface StreamEvent {
  event: "message" | "message_end" | "error" | "ping";
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  metadata?: Record<string, any>;
  created_at?: number;
}

// 文本补全响应
export interface CompletionResponse {
  message_id: string;
  mode: string;
  answer: string;
  metadata?: Record<string, any>;
  created_at: number;
}

// 消息反馈响应
export interface MessageFeedbackResponse {
  result: string;
}

// 会话列表响应
export interface ConversationsResponse {
  limit: number;
  has_more: boolean;
  data: Conversation[];
}

export interface Conversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  created_at: number;
}

// 消息列表响应
export interface MessagesResponse {
  limit: number;
  has_more: boolean;
  data: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  answer: string;
  feedback: null | "like" | "dislike";
  created_at: number;
}

// 应用信息响应
export interface AppInfoResponse {
  user_input_form: Array<{
    variable: string;
    label: string;
    required: boolean;
    max_length: number;
    default: string;
  }>;
  file_upload?: {
    enabled: boolean;
    allowed_file_types: string[];
    max_count: number;
    max_size: number;
  };
  system_parameters?: {
    image_file_size_limit?: number;
  };
}

// 标注响应
export interface AnnotationsResponse {
  limit: number;
  has_more: boolean;
  data: Annotation[];
}

export interface Annotation {
  id: string;
  question: string;
  answer: string;
  conversation_id?: string;
  message_id?: string;
  created_at: number;
}

// 文件预览响应
export interface FilePreviewResponse {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// 变量响应
export interface ConversationVariablesResponse {
  data: Array<{
    id: string;
    name: string;
    value: string;
    description: string;
  }>;
}

// 通用响应
export interface GenericResponse {
  result: string;
}

// 音频响应
export type AudioResponse = any; // 流或二进制数据

// 元数据响应
export interface MetaResponse {
  tool_icons: Record<string, any>;
}

// 站点信息响应
export interface SiteResponse {
  title: string;
  description: string;
  icon: string;
  icon_background: string;
  privacy_policy: string;
  custom_disclaimer: string;
}

// 标注回复设置响应
export interface AnnotationReplySetupResponse {
  enabled: boolean;
  score_threshold: number;
  embedding_provider_name: string;
  embedding_model_name: string;
}

// 标注回复状态响应
export interface AnnotationReplyStatusResponse {
  job_id: string;
  job_status: string;
  error_msg?: string;
}
