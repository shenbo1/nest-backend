export class MessageFeedbackDto {
  /**
   * 消息ID
   */
  message_id: string;

  /**
   * 评分：like（喜欢）或 dislike（不喜欢）
   */
  rating: "like" | "dislike";

  /**
   * 用户标识
   */
  user: string;

  /**
   * 反馈内容（可选）
   */
  content?: string;
}

export class AppFeedbackQueryDto {
  /**
   * 页码（可选，默认为1）
   */
  page?: number;

  /**
   * 每页数量（可选，默认为20）
   */
  limit?: number;
}
