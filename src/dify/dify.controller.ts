import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Sse,
  Query,
  MessageEvent,
} from "@nestjs/common";
import { ApiQuery, ApiTags, ApiOperation } from "@nestjs/swagger";
import { DifyService } from "./dify.service";
import { Observable } from "rxjs";
import type { StreamEvent } from "./types/dify-response.types";
import type { SaveMessageData } from "./types/message.types";
import { Public } from "@/common/guard/jwt-auth.guard";
import { CurrentUser } from "@/common/decorator/current-user";

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
  @ApiOperation({ summary: "流式聊天" })
  @ApiQuery({ name: "query", required: true, description: "聊天内容" })
  @ApiQuery({
    name: "conversationId",
    required: false,
    description: "会话ID(可选)",
  })
  chatStream(
    @Query("query") query: string,
    @Query("conversationId") conversationId?: string,
    @CurrentUser() currentUser?: { mobile: string; memberId: string }
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      this.difyService
        .chatStream(
          query,
          currentUser?.memberId.toString() ?? "",
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
  @ApiOperation({ summary: "获取应用信息" })
  async getAppInfo() {
    return this.difyService.getAppInfo();
  }

  /**
   * 停止消息生成
   * @example POST /dify/chat/:taskId/stop
   */
  @Post("chat/:taskId/stop")
  @ApiOperation({ summary: "停止消息生成" })
  async stopChatMessage(
    @Param("taskId") taskId: string,
    @Body("user") user: string
  ) {
    return this.difyService.stopChatMessage(taskId, user);
  }

  /**
   * 获取用户的会话列表(分页)
   * @example GET /dify/history?userId=user123&page=1&limit=20
   */
  @Get("history")
  @ApiOperation({ summary: "获取用户的会话列表(分页)" })
  @ApiQuery({ name: "page", required: false, description: "页码(从1开始)" })
  @ApiQuery({ name: "limit", required: false, description: "每页数量" })
  async getHistory(
    @CurrentUser() currentUser?: { mobile: string; memberId: string },
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.difyService.getConversationHistory(
      currentUser?.memberId.toString() ?? "",
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
  }

  /**
   * 获取特定会话的所有消息(分页)
   * @example GET /dify/history/:conversationId/messages?page=1&limit=50
   */
  @Get("history/:conversationId/messages")
  @ApiOperation({ summary: "获取会话的所有消息(分页)" })
  @ApiQuery({ name: "page", required: false, description: "页码(从1开始)" })
  @ApiQuery({ name: "limit", required: false, description: "每页数量" })
  async getConversationMessages(
    @Param("conversationId") conversationId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.difyService.getConversationMessages(
      conversationId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50
    );
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
   * 获取会话变量
   * @example GET /dify/conversations/:conversationId/variables?user=user123
   */
  @Get("conversations/:conversationId/variables")
  @ApiOperation({ summary: "获取会话变量" })
  @ApiQuery({
    name: "variableName",
    required: false,
    description: "变量名称（可选）",
  })
  async getConversationVariables(
    @Param("conversationId") conversationId: string,

    @Query("variableName") variableName?: string,
    @CurrentUser() currentUser?: { mobile: string; memberId: string }
  ) {
    return this.difyService.getConversationVariables(
      conversationId,
      currentUser?.memberId.toString() ?? "",
      variableName
    );
  }

  /**
   * 更新会话变量
   * @example POST /dify/conversations/variables
   */
  @Post("conversations/variables")
  @ApiOperation({ summary: "更新会话变量" })
  async updateConversationVariable(
    @Body("conversationId") conversationId: string,
    @Body("variableId") variableId: string,

    @Body("value") value: string,
    @CurrentUser() currentUser?: { mobile: string; memberId: string }
  ) {
    return this.difyService.updateConversationVariable(
      conversationId,
      variableId,
      currentUser?.memberId.toString() ?? "",
      value
    );
  }

  /**
   * 保存找房结果
   * @example POST /dify/house-search-result
   */
  @Post("house-search-result")
  @ApiOperation({ summary: "保存找房结果" })
  async saveHouseSearchResult(
    @Body()
    body: {
      conversationId: string;

      searchParams: Record<string, any>;
      result: Record<string, any>;
      messageId?: string;
    },
    @CurrentUser() currentUser?: { mobile: string; memberId: string }
  ) {
    return await this.difyService.saveHouseSearchResult(
      body.conversationId,
      currentUser?.memberId.toString() ?? "",
      body.searchParams,
      body.result,
      body.messageId
    );
  }

  /**
   * 保存对话和消息
   * @example POST /dify/save-conversation
   */
  @Post("save-conversation")
  @ApiOperation({ summary: "保存对话和消息" })
  async saveConversation(
    @Body() body: SaveMessageData,
    @CurrentUser() currentUser?: { mobile: string; memberId: string }
  ) {
    body.userId = currentUser?.memberId.toString() ?? "";
    return await this.difyService.saveConversationWithMessages(body);
  }
}
