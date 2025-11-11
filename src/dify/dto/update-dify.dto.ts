import { PartialType } from "@nestjs/swagger";
import { CreateDifyDto } from "./create-dify.dto";

export class UpdateDifyDto extends PartialType(CreateDifyDto) {}
