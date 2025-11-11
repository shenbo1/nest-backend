/**
 * 消息类型枚举
 */
export enum MessageType {
  QUERY = "QUERY", // 用户问题
  ANSWER = "ANSWER", // AI回答
}

/**
 * 消息内容类型枚举
 */
export enum MessageContentType {
  TEXT = "TEXT", // 文本消息
  IMAGE = "IMAGE", // 图片
  FILE = "FILE", // 文件
  AUDIO = "AUDIO", // 音频
  VIDEO = "VIDEO", // 视频
  MARKDOWN = "MARKDOWN", // Markdown格式
  CODE = "CODE", // 代码
  JSON = "JSON", // JSON数据
  MIXED = "MIXED", // 混合类型(包含多种格式)
}

/**
 * 消息保存数据接口
 */
export interface SaveMessageData {
  conversationId: string;
  userId: string;
  query: string;
  answer: string;
  messageId?: string;
  metadata?: any;
  contentType?: MessageContentType;
}
