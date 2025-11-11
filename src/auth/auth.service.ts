import { Injectable } from "@nestjs/common";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiConfigService } from "@/config";
import { User } from "generated/prisma/client";
import * as jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ApiConfigService,
  ) {}
  async login(userCode: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        userCode,
        password,
      },
      select: {
        id: true,
        userName: true,
        userCode: true,
      },
    });
    if (!user) {
      throw new Error("用户不存在");
    }
    return this.afterLogin(user);
  }

  afterLogin(payload) {
    const { secret, expiresIn } = this.configService.jwtConfig;
    const token = jwt.sign(payload, secret, {
      expiresIn,
    });
    return { access_token: token };
  }

  create(createAuthDto: CreateAuthDto) {
    return "This action adds a new auth";
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
