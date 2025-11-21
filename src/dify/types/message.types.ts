/**
 * 消息角色枚举
 */
export enum MessageRole {
  USER = "USER", // 用户
  ASSISTANT = "ASSISTANT", // 助手
  SYSTEM = "SYSTEM", // 系统
}

/**
 * 消息内容类型枚举
 */
export enum MessageContentType {
  TEXT = "TEXT", // 文本消息
  IMAGE = "IMAGE", // 图片
  CARD = "CARD", // 卡片
  RECOMMEND = "RECOMMEND", // 推荐
  FILE = "FILE", // 文件
}

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  PENDING = "PENDING", // 等待中
  STREAMING = "STREAMING", // 流式生成中
  COMPLETED = "COMPLETED", // 已完成
  FAILED = "FAILED", // 失败
  STOPPED = "STOPPED", // 已停止
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
  queryType?: MessageContentType;
  answerType?: MessageContentType;
  status?:
    | MessageStatus
    | "PENDING"
    | "STREAMING"
    | "COMPLETED"
    | "FAILED"
    | "STOPPED";
}
