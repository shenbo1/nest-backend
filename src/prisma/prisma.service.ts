import { Injectable } from "@nestjs/common";
import { PrismaClient } from "generated/prisma/client";

@Injectable()
export class PrismaService {
  private prisma: PrismaClient;
}
