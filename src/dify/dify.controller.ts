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
   * 获取应用信息
   * @example GET /dify/app-info
   */
  @Get("app-info")
  @Public()
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
   * 删除会话
   * @example DELETE /dify/history/:conversationId
   */
  @Delete("history/:conversationId")
  @ApiOperation({ summary: "删除会话" })
  async deleteConversation(@Param("conversationId") conversationId: string) {
    return this.difyService.deleteConversationRecord(conversationId);
  }
}
