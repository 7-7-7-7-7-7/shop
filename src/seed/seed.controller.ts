import { Controller, Get } from "@nestjs/common";
import { SeedService } from "./seed.service";
import { Auth, GetUser } from "../auth/decorators";
import { ValidRoles } from "../auth/interfaces";
import { User } from "../auth/entities/user.entity";

@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
  ) {}

  @Get()
  @Auth(ValidRoles.admin)
  executedSeed(@GetUser() user: User) {
    return this.seedService.runSeed(user);
  }
}
