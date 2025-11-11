import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { Public } from "@/common/guard/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { PrismaService } from "@/prisma/prisma.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Public()
  @Post("login")
  login(@Body() login: LoginDto) {
    return this.authService.login(login.username, login.password);
  }

  @Post()
  async create(@Body() createAuthDto: CreateAuthDto) {
    const ddd = await this.prismaService.user.create({
      data: {
        userCode: "user1",
        userName: "普通用户",
        email: "<EMAIL>",
        password: "password",
      },
    });
    console.log("ddd", ddd);
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.authService.remove(+id);
  }
}
