import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiConfigService } from "@/config";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, ApiConfigService],
})
export class AuthModule {}
