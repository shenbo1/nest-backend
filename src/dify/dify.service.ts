import { Injectable } from "@nestjs/common";
import { DifyClient } from "./dify.client";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiConfigService } from "@/config";
import type { StreamEvent } from "./types/dify-response.types";
import {
  MessageContentType,
  type SaveMessageData,
} from "./types/message.types";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

@Injectable()
export class DifyService {
  private readonly client: DifyClient;

  constructor(
    private readonly config: ApiConfigService,
    private readonly prisma: PrismaService
  ) {
    const { apiKey, baseUrl } = this.config.difyConfig;

    if (!apiKey) {
      throw new Error("DIFY_API_KEY is not configured");
    }

    this.client = new DifyClient(apiKey, baseUrl);
  }

  /**
   * 流式聊天
   * @param query 用户查询
   * @param user 用户标识
   * @param conversationId 会话ID（可选）
   * @param onEvent 事件回调
   * @param onError 错误回调
   * @param onComplete 完成回调
   */
  async chatStream(
    query: string,
    user: string,
    conversationId?: string,
    onEvent?: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    let fullAnswer = "";
    let finalConversationId = conversationId || "";
    let finalMessageId = "";

    return this.client.chatStream(
      {
        query,
        user,
        inputs: {},
        conversation_id: conversationId,
        response_mode: "streaming",
      },
      (event: StreamEvent) => {
        // 收集完整回答
        if (event.event === "message" && event.answer) {
          fullAnswer += event.answer;
        }
        // 记录会话和消息 ID
        if (event.event === "message_end") {
          finalConversationId = event.conversation_id || finalConversationId;
          finalMessageId = event.message_id || "";
        }
        // 调用用户回调
        onEvent?.(event);
      },
      onError,
      () => {
        // 保存对话记录和消息
        void this.saveConversationWithMessages({
          conversationId: finalConversationId,
          userId: user,
          query,
          answer: fullAnswer,
          messageId: finalMessageId,
        }).catch((error) => {
          console.error("保存对话记录失败:", error);
        });
        // 调用用户完成回调
        onComplete?.();
      }
    );
  }

  /**
   * 阻塞式聊天
   * @param query 用户查询
   * @param user 用户标识
   * @param conversationId 会话ID（可选）
   */
  async chat(query: string, user: string, conversationId?: string) {
    const result = await this.client.chatMessages({
      query,
      user,
      conversation_id: conversationId,
      response_mode: "blocking",
    });

    // 保存对话记录和消息
    try {
      await this.saveConversationWithMessages({
        conversationId: result.conversation_id,
        userId: user,
        query,
        answer: result.answer,
        messageId: result.message_id,
        metadata: result.metadata,
      });
    } catch (error) {
      console.error("保存对话记录失败:", error);
    }

    return result;
  }

  /**
   * 保存对话记录和消息(使用事务)
   */
  private async saveConversationWithMessages(data: SaveMessageData) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 确保会话存在(如果不存在则创建)
      let conversation = await tx.difyConversation.findUnique({
        where: { conversationId: data.conversationId },
      });

      if (!conversation) {
        conversation = await tx.difyConversation.create({
          data: {
            conversationId: data.conversationId,
            userId: data.userId,
            name: data.query.substring(0, 50), // 用问题前50字符作为会话标题
            messageCount: 0,
            metadata: data.metadata,
          },
        });
      }

      // 2. 保存用户问题消息
      const queryMessage = await tx.difyMessage.create({
        data: {
          conversationId: data.conversationId,
          messageId: `${data.messageId}_query`,
          userId: data.userId,
          role: "USER",
          contentType: MessageContentType.TEXT,
          content: data.query,
        },
      });

      // 3. 保存AI回答消息
      const answerMessage = await tx.difyMessage.create({
        data: {
          conversationId: data.conversationId,
          messageId: data.messageId || `${data.conversationId}_answer`,
          userId: data.userId,
          role: "ASSISTANT",
          contentType: data.contentType || MessageContentType.TEXT,
          content: data.answer,
          parentMessageId: queryMessage.messageId,
        },
      });

      // 4. 更新会话的消息计数
      await tx.difyConversation.update({
        where: { conversationId: data.conversationId },
        data: {
          messageCount: { increment: 2 }, // 问题+回答=2条消息
        },
      });

      return { conversation, queryMessage, answerMessage };
    });
  }

  /**
   * 获取用户的会话列表
   * @param userId 用户ID
   * @param limit 返回数量
   */
  async getConversationHistory(userId: string, limit: number = 50) {
    return this.prisma.difyConversation.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  /**
   * 获取特定会话的详细信息
   * @param conversationId 会话ID
   */
  async getConversationDetail(conversationId: string) {
    return this.prisma.difyConversation.findUnique({
      where: { conversationId },
    });
  }

  /**
   * 获取特定会话的所有消息
   * @param conversationId 会话ID
   */
  async getConversationMessages(conversationId: string) {
    return this.prisma.difyMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * 更新会话名称
   * @param conversationId 会话ID
   * @param name 新名称
   */
  async updateConversationName(conversationId: string, name: string) {
    return this.prisma.difyConversation.update({
      where: { conversationId },
      data: { name },
    });
  }

  /**
   * 归档会话
   * @param conversationId 会话ID
   */
  async archiveConversation(conversationId: string) {
    return this.prisma.difyConversation.update({
      where: { conversationId },
      data: { status: "ARCHIVED" },
    });
  }

  /**
   * 删除会话(软删除)
   * @param conversationId 会话ID
   */
  async deleteConversationRecord(conversationId: string) {
    return this.prisma.difyConversation.update({
      where: { conversationId },
      data: { status: "DELETED" },
    });
  }

  /**
   * 获取用户的所有消息
   * @param userId 用户ID
   * @param limit 返回数量
   */
  async getUserMessages(userId: string, limit: number = 100) {
    return this.prisma.difyMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * 删除消息记录
   * @param id 消息ID
   */
  async deleteMessage(id: number) {
    return this.prisma.difyMessage.delete({
      where: { id },
    });
  }

  /**
   * 获取会话列表(从 Dify API)
   * @param user 用户标识
   * @param limit 返回数量
   */
  async getConversations(user: string, limit: number = 20) {
    return this.client.getConversations(user, undefined, limit);
  }

  /**
   * 获取消息列表(从 Dify API)
   * @param user 用户标识
   * @param conversationId 会话ID
   */
  async getMessages(user: string, conversationId: string) {
    return this.client.getMessages(user, conversationId);
  }

  /**
   * 删除会话
   * @param conversationId 会话ID
   * @param user 用户标识
   */
  async deleteConversation(conversationId: string, user: string) {
    return this.client.deleteConversation(conversationId, user);
  }

  /**
   * 获取应用信息
   */
  async getAppInfo() {
    return this.client.getAppInfo();
  }
}
