import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiConfigService } from "@/config";
import { ClsModule } from "nestjs-cls";

describe("AuthController", () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule.forRoot({ global: true })],
      controllers: [AuthController],
      providers: [
        AuthService,
        PrismaService,
        {
          provide: ApiConfigService,
          useValue: {
            jwtSecret: "test-secret",
            jwtExpiresIn: "1h",
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
