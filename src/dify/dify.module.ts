import { Module } from "@nestjs/common";
import { DifyService } from "./dify.service";
import { DifyController } from "./dify.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiConfigService } from "@/config";

@Module({
  imports: [],
  controllers: [DifyController],
  providers: [DifyService, ApiConfigService, PrismaService],
  exports: [DifyService],
})
export class DifyModule {}
