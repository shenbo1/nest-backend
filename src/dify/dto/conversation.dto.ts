export class GetConversationsDto {
  /**
   * 用户标识
   */
  user: string;

  /**
   * 最后一个会话ID（可选）
   */
  last_id?: string;

  /**
   * 返回会话数量（可选）
   */
  limit?: number;

  /**
   * 是否置顶（可选）
   */
  pinned?: boolean;
}

export class RenameConversationDto {
  /**
   * 用户标识
   */
  user: string;

  /**
   * 会话名称（可选）
   */
  name?: string;

  /**
   * 是否自动生成名称（可选）
   */
  auto_generate?: boolean;
}

export class ConversationVariableDto {
  /**
   * 用户标识
   */
  user: string;

  /**
   * 变量值
   */
  value: string;

  /**
   * 变量名称（可选）
   */
  variable_name?: string;
}
