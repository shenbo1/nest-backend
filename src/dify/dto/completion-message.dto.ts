export class CompletionMessageDto {
  /**
   * 输入参数（可选）
   */
  inputs?: Record<string, any>;

  /**
   * 用户输入的文本内容
   */
  query: string;

  /**
   * 响应模式：streaming（流式）或 blocking（阻塞）
   */
  response_mode: "streaming" | "blocking";

  /**
   * 用户标识
   */
  user: string;

  /**
   * 会话ID（可选）
   */
  conversation_id?: string;
}
