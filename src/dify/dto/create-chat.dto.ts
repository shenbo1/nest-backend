export class CreateChatDto {
  /**
   * 用户输入的聊天内容
   */
  query: string;

  /**
   * 输入参数（可选）
   */
  inputs?: Record<string, any>;

  /**
   * 响应模式：streaming（流式）或 blocking（阻塞）
   */
  response_mode: "streaming" | "blocking";

  /**
   * 会话ID（可选）
   */
  conversation_id?: string;

  /**
   * 用户标识
   */
  user: string;
}
