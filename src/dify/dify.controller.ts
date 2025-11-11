import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Sse,
  Query,
  MessageEvent,
} from "@nestjs/common";
import { ApiQuery, ApiTags, ApiOperation } from "@nestjs/swagger";
import { DifyService } from "./dify.service";
import { CreateChatDto } from "./dto/create-chat.dto";
import { Observable } from "rxjs";
import type { StreamEvent } from "./types/dify-response.types";
import { Public } from "@/common/guard/jwt-auth.guard";

/* eslint-disable @typescript-eslint/no-unsafe-return */

@ApiTags("Dify")
@Controller("dify")
export class DifyController {
  constructor(private readonly difyService: DifyService) {}

  /**
   * 流式聊天 - 使用 SSE (Server-Sent Events)
   * @example GET /dify/chat/stream?query=你好&user=user123&conversationId=abc
   */
  @Sse("chat/stream")
  @Public()
  @ApiOperation({ summary: "流式聊天" })
  @ApiQuery({ name: "query", required: true, description: "聊天内容" })
  @ApiQuery({ name: "user", required: true, description: "用户ID" })
  @ApiQuery({
    name: "conversationId",
    required: false,
    description: "会话ID(可选)",
  })
  chatStream(
    @Query("query") query: string,
    @Query("user") user: string,
    @Query("conversationId") conversationId?: string
  ): Observable<MessageEvent> {
    console.log("date", new Date());
    return new Observable((subscriber) => {
      this.difyService
        .chatStream(
          query,
          user,
          conversationId,
          (event: StreamEvent) => {
            // 发送流式事件给客户端
            subscriber.next({
              data: event,
            } as MessageEvent);
          },
          (error: Error) => {
            // 发送错误给客户端
            subscriber.error(error);
          },
          () => {
            // 流结束
            subscriber.complete();
          }
        )
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  /**
   * 阻塞式聊天
   * @example POST /dify/chat { "query": "你好", "user": "user123", "conversationId": "abc" }
   */
  @Post("chat")
  @ApiOperation({ summary: "阻塞式聊天" })
  async chat(@Body() createChatDto: CreateChatDto) {
    const { query, user, conversation_id } = createChatDto;
    return this.difyService.chat(query, user, conversation_id);
  }

  /**
   * 获取会话列表
   * @example GET /dify/conversations?user=user123&limit=20
   */
  @Get("conversations")
  @ApiOperation({ summary: "获取会话列表" })
  @ApiQuery({ name: "limit", required: false, description: "返回数量" })
  async getConversations(
    @Query("user") user: string,
    @Query("limit") limit?: number
  ) {
    return this.difyService.getConversations(user, limit);
  }

  /**
   * 获取消息列表
   * @example GET /dify/conversations/:id/messages?user=user123
   */
  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "获取会话消息列表(Dify API)" })
  async getConversationMessagesFromDify(
    @Param("id") conversationId: string,
    @Query("user") user: string
  ) {
    return this.difyService.getMessages(user, conversationId);
  }

  /**
   * 获取应用信息
   * @example GET /dify/app-info
   */
  @Get("app-info")
  @ApiOperation({ summary: "获取应用信息" })
  async getAppInfo() {
    return this.difyService.getAppInfo();
  }

  /**
   * 获取用户的会话列表
   * @example GET /dify/history?userId=user123&limit=50
   */
  @Get("history")
  @ApiOperation({ summary: "获取用户的会话列表" })
  @ApiQuery({ name: "limit", required: false, description: "返回数量" })
  async getHistory(
    @Query("userId") userId: string,
    @Query("limit") limit?: number
  ) {
    return this.difyService.getConversationHistory(userId, limit);
  }

  /**
   * 获取会话详细信息
   * @example GET /dify/history/:conversationId/detail
   */
  @Get("history/:conversationId/detail")
  @ApiOperation({ summary: "获取会话详细信息" })
  async getConversationDetail(@Param("conversationId") conversationId: string) {
    return this.difyService.getConversationDetail(conversationId);
  }

  /**
   * 获取特定会话的所有消息
   * @example GET /dify/history/:conversationId/messages
   */
  @Get("history/:conversationId/messages")
  @ApiOperation({ summary: "获取会话的所有消息" })
  async getConversationMessages(
    @Param("conversationId") conversationId: string
  ) {
    return this.difyService.getConversationMessages(conversationId);
  }

  /**
   * 更新会话名称
   * @example PATCH /dify/history/:conversationId/name
   */
  @Patch("history/:conversationId/name")
  @ApiOperation({ summary: "更新会话名称" })
  async updateConversationName(
    @Param("conversationId") conversationId: string,
    @Body("name") name: string
  ) {
    return this.difyService.updateConversationName(conversationId, name);
  }

  /**
   * 归档会话
   * @example POST /dify/history/:conversationId/archive
   */
  @Post("history/:conversationId/archive")
  @ApiOperation({ summary: "归档会话" })
  async archiveConversation(@Param("conversationId") conversationId: string) {
    return this.difyService.archiveConversation(conversationId);
  }

  /**
   * 删除会话
   * @example DELETE /dify/history/:conversationId
   */
  @Delete("history/:conversationId")
  @ApiOperation({ summary: "删除会话" })
  async deleteConversation(@Param("conversationId") conversationId: string) {
    return this.difyService.deleteConversationRecord(conversationId);
  }

  /**
   * 获取用户的所有消息
   * @example GET /dify/user-messages?userId=user123&limit=100
   */
  @Get("user-messages")
  @ApiOperation({ summary: "获取用户的所有消息" })
  @ApiQuery({ name: "limit", required: false, description: "返回数量" })
  async getUserMessages(
    @Query("userId") userId: string,
    @Query("limit") limit?: number
  ) {
    return this.difyService.getUserMessages(userId, limit);
  }

  /**
   * 删除消息
   * @example DELETE /dify/messages/:id
   */
  @Delete("messages/:id")
  @ApiOperation({ summary: "删除消息记录" })
  async deleteMessage(@Param("id") id: string) {
    return this.difyService.deleteMessage(id);
  }
}
