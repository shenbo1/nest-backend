import axios, { AxiosInstance, AxiosError } from "axios";
import { ChatMessageDto } from "./dto/chat-message.dto";
import {
  DifyError,
  DifyNetworkError,
  DifyAuthError,
  DifyRateLimitError,
  DifyStreamError,
} from "./errors/dify.errors";
import type {
  ChatMessageResponse,
  StreamEvent,
  GenericResponse,
} from "./types/dify-response.types";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * Dify API Client
 * 提供对Dify平台所有API的封装，包含完整的类型定义和错误处理
 */
export class DifyClient {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * 构造函数
   * @param apiKey Dify API密钥
   * @param baseUrl Dify API基础URL
   * @param timeout 请求超时时间（毫秒），默认30秒
   */
  constructor(
    private readonly apiKey: string,
    baseUrl: string,
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // 添加响应拦截器统一处理错误
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  /**
   * 统一错误处理
   */
  private handleError(error: AxiosError): DifyError {
    if (!error.response) {
      return new DifyNetworkError("网络请求失败", error.message);
    }

    const { status, data } = error.response;
    const message = (data as any)?.message || error.message;

    switch (status) {
      case 401:
        return new DifyAuthError(message);
      case 429:
        return new DifyRateLimitError(message);
      default:
        return new DifyError(message, status, (data as any)?.code, data);
    }
  }

  /**
   * 发送聊天消息
   * @param params 聊天参数
   * @returns API响应数据
   */
  async chatMessages(params: ChatMessageDto): Promise<ChatMessageResponse> {
    const response = await this.httpClient.post<ChatMessageResponse>(
      "/chat-messages",
      {
        ...params,
        response_mode: "blocking",
      }
    );
    return response.data;
  }

  /**
   * 发送聊天消息 (流式模式)
   * @param request 聊天请求参数
   * @param onEvent 事件回调函数
   * @param onError 错误回调函数
   * @param onComplete 完成回调函数
   */
  async chatStream(
    request: ChatMessageDto,
    onEvent: (event: StreamEvent) => void | Promise<void>,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const response = await this.httpClient.post(
        "/chat-messages",
        {
          ...request,
          response_mode: "streaming",
        },
        {
          responseType: "stream",
          timeout: 0, // 流式请求不设置超时
        }
      );

      const stream = response.data as NodeJS.ReadableStream;
      let buffer = "";

      stream.on("data", (chunk: Buffer) => {
        try {
          buffer += chunk.toString();
          const lines = buffer.split("\n");

          // 保留最后一个可能不完整的行
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (!trimmedLine || !trimmedLine.startsWith("data: ")) {
              continue;
            }

            const data = trimmedLine.slice(6).trim();

            // 跳过心跳和结束标记
            if (data === "[DONE]" || !data) {
              continue;
            }

            try {
              const event = JSON.parse(data) as StreamEvent;
              void onEvent(event); // 不等待 Promise 完成
            } catch {
              // 忽略无法解析的数据
            }
          }
        } catch (error) {
          onError?.(
            new DifyStreamError(
              "流数据处理失败",
              error instanceof Error ? error.message : String(error)
            )
          );
        }
      });

      stream.on("end", () => {
        onComplete?.();
      });

      stream.on("error", (error: Error) => {
        onError?.(new DifyStreamError("流连接错误", error.message));
      });
    } catch (error) {
      const difyError =
        error instanceof DifyError
          ? error
          : new DifyStreamError(
              "启动流式请求失败",
              error instanceof Error ? error.message : String(error)
            );
      onError?.(difyError);
      throw difyError;
    }
  }

  /**
   * 停止消息生成
   * @param task_id 任务ID
   * @param user 用户标识
   * @returns API响应数据
   */
  async stopChatMessage(
    task_id: string,
    user: string
  ): Promise<GenericResponse> {
    const response = await this.httpClient.post<GenericResponse>(
      `/chat-messages/${task_id}/stop`,
      {
        user,
      }
    );
    return response.data;
  }

  /**
   * 提交消息反馈
   * @param message_id 消息ID
   * @param rating 评分 (like/dislike)
   * @param user 用户标识
   * @param content 反馈内容
   * @returns API响应数据
   */
  async messageFeedback(
    message_id: string,
    rating: "like" | "dislike",
    user: string,
    content?: string
  ) {
    const response = await this.httpClient.post(
      `/messages/${message_id}/feedbacks`,
      {
        rating,
        user,
        content,
      }
    );
    return response.data;
  }

  /**
   * 获取应用反馈
   * @param page 页码
   * @param limit 每页数量
   * @returns API响应数据
   */
  async getAppFeedbacks(page: number = 1, limit: number = 20) {
    const response = await this.httpClient.get("/app/feedbacks", {
      params: {
        page,
        limit,
      },
    });
    return response.data;
  }

  /**
   * 获取消息列表
   * @param user 用户标识
   * @param conversation_id 会话ID
   * @param first_id 起始消息ID
   * @param limit 返回消息数量
   * @returns API响应数据
   */
  async getMessages(
    user: string,
    conversation_id?: string,
    first_id?: string,
    limit?: number
  ) {
    const response = await this.httpClient.get("/messages", {
      params: {
        user,
        conversation_id,
        first_id,
        limit,
      },
    });
    return response.data;
  }

  /**
   * 获取会话列表
   * @param user 用户标识
   * @param last_id 最后一个会话ID
   * @param limit 返回会话数量
   * @param pinned 是否置顶
   * @returns API响应数据
   */
  async getConversations(
    user: string,
    last_id?: string,
    limit?: number,
    pinned?: boolean
  ) {
    const response = await this.httpClient.get("/conversations", {
      params: {
        user,
        last_id,
        limit,
        pinned,
      },
    });
    return response.data;
  }

  /**
   * 删除会话
   * @param conversation_id 会话ID
   * @param user 用户标识
   * @returns API响应数据
   */
  async deleteConversation(conversation_id: string, user: string) {
    const response = await this.httpClient.delete(
      `/conversations/${conversation_id}`,
      {
        data: {
          user,
        },
      }
    );
    return response.data;
  }

  /**
   * 重命名会话
   * @param conversation_id 会话ID
   * @param user 用户标识
   * @param name 会话名称
   * @param auto_generate 是否自动生成名称
   * @returns API响应数据
   */
  async renameConversation(
    conversation_id: string,
    user: string,
    name?: string,
    auto_generate?: boolean
  ) {
    const response = await this.httpClient.post(
      `/conversations/${conversation_id}/name`,
      {
        user,
        name,
        auto_generate,
      }
    );
    return response.data;
  }

  /**
   * 获取会话变量
   * @param conversation_id 会话ID
   * @param user 用户标识
   * @param variable_name 变量名称（可选）
   * @returns API响应数据
   */
  async getConversationVariables(
    conversation_id: string,
    user: string,
    variable_name?: string
  ) {
    const response = await this.httpClient.get(
      `/conversations/${conversation_id}/variables`,
      {
        params: {
          user,
          variable_name,
        },
      }
    );
    return response.data;
  }

  /**
   * 更新会话变量
   * @param conversation_id 会话ID
   * @param variable_id 变量ID
   * @param user 用户标识
   * @param value 变量值
   * @returns API响应数据
   */
  async updateConversationVariable(
    conversation_id: string,
    variable_id: string,
    user: string,
    value: string
  ) {
    const response = await this.httpClient.put(
      `/conversations/${conversation_id}/variables/${variable_id}`,
      {
        user,
        value,
      }
    );
    return response.data;
  }

  /**
   * 获取应用信息
   * @returns API响应数据
   */
  async getAppInfo() {
    const response = await this.httpClient.get("/parameters");
    return response.data;
  }

  /**
   * 获取元数据
   * @returns API响应数据
   */
  async getMeta() {
    const response = await this.httpClient.get("/meta");
    return response.data;
  }

  /**
   * 获取站点信息
   * @returns API响应数据
   */
  async getSiteInfo() {
    const response = await this.httpClient.get("/site");
    return response.data;
  }

  /**
   * 获取标注列表
   * @param page 页码
   * @param limit 每页数量
   * @returns API响应数据
   */
  async getAnnotations(page: number = 1, limit: number = 20) {
    const response = await this.httpClient.get("/apps/annotations", {
      params: {
        page,
        limit,
      },
    });
    return response.data;
  }

  /**
   * 创建标注
   * @param question 问题
   * @param answer 答案
   * @param conversation_id 会话ID（可选）
   * @param message_id 消息ID（可选）
   * @returns API响应数据
   */
  async createAnnotation(
    question: string,
    answer: string,
    conversation_id?: string,
    message_id?: string
  ) {
    const response = await this.httpClient.post("/apps/annotations", {
      question,
      answer,
      conversation_id,
      message_id,
    });
    return response.data;
  }

  /**
   * 更新标注
   * @param annotation_id 标注ID
   * @param question 问题
   * @param answer 答案
   * @returns API响应数据
   */
  async updateAnnotation(
    annotation_id: string,
    question: string,
    answer: string
  ) {
    const response = await this.httpClient.put(
      `/apps/annotations/${annotation_id}`,
      {
        question,
        answer,
      }
    );
    return response.data;
  }

  /**
   * 删除标注
   * @param annotation_id 标注ID
   * @returns API响应数据
   */
  async deleteAnnotation(annotation_id: string) {
    const response = await this.httpClient.delete(
      `/apps/annotations/${annotation_id}`
    );
    return response.data;
  }

  /**
   * 标注回复初始设置
   * @param action 操作类型
   * @param score_threshold 分数阈值
   * @param embedding_provider_name 嵌入提供商名称
   * @param embedding_model_name 嵌入模型名称
   * @returns API响应数据
   */
  async annotationReplySetup(
    action: string,
    score_threshold: number,
    embedding_provider_name: string,
    embedding_model_name: string
  ) {
    const response = await this.httpClient.post(
      `/apps/annotation-reply/${action}`,
      {
        score_threshold,
        embedding_provider_name,
        embedding_model_name,
      }
    );
    return response.data;
  }

  /**
   * 查询任务状态
   * @param action 操作类型
   * @param job_id 任务ID
   * @returns API响应数据
   */
  async getAnnotationReplyStatus(action: string, job_id: string) {
    const response = await this.httpClient.get(
      `/apps/annotation-reply/${action}/status/${job_id}`
    );
    return response.data;
  }

  /**
   * 获取标注回复设置
   * @returns API响应数据
   */
  async getAnnotationReplySetup() {
    const response = await this.httpClient.get("/apps/annotation-reply");
    return response.data;
  }

  /**
   * 更新标注回复设置
   * @param enabled 是否启用
   * @param embedding_model_name 嵌入模型名称
   * @returns API响应数据
   */
  async updateAnnotationReplySetup(
    enabled: boolean,
    embedding_model_name: string
  ) {
    const response = await this.httpClient.post("/apps/annotation-reply", {
      enabled,
      embedding_model_name,
    });
    return response.data;
  }
}
