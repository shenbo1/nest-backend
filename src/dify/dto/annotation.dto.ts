export class GetAnnotationsDto {
  /**
   * 页码（可选，默认为1）
   */
  page?: number;

  /**
   * 每页数量（可选，默认为20）
   */
  limit?: number;
}

export class CreateAnnotationDto {
  /**
   * 问题内容
   */
  question: string;

  /**
   * 答案内容
   */
  answer: string;

  /**
   * 会话ID（可选）
   */
  conversation_id?: string;

  /**
   * 消息ID（可选）
   */
  message_id?: string;
}

export class UpdateAnnotationDto {
  /**
   * 问题内容
   */
  question: string;

  /**
   * 答案内容
   */
  answer: string;
}

export class AnnotationReplySetupDto {
  /**
   * 分数阈值
   */
  score_threshold: number;

  /**
   * 嵌入提供商名称
   */
  embedding_provider_name: string;

  /**
   * 嵌入模型名称
   */
  embedding_model_name: string;
}

export class AnnotationReplyStatusDto {
  /**
   * 操作类型
   */
  action: string;

  /**
   * 任务ID
   */
  job_id: string;
}
