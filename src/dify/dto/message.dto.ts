export class GetMessagesDto {
  /**
   * 用户标识
   */
  user: string;

  /**
   * 会话ID（可选）
   */
  conversation_id?: string;

  /**
   * 起始消息ID（可选）
   */
  first_id?: string;

  /**
   * 返回消息数量（可选）
   */
  limit?: number;
}
