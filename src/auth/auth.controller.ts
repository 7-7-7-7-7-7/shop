import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { SignInDto } from "./dto/signIn.dto";
import { AuthGuard } from "@nestjs/passport";
import { Auth, GetUser, RawHeaders, RoleProtected } from "./decorators";
import { UserRoleGuard } from "./guards/user-role/user-role.guard";
import { ValidRoles } from "./interfaces";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testPrivateRoute(
    @GetUser() user,
    @GetUser() userEmail: string,
    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      message: 'HOLA MUNDO (private)',
      user,
      userEmail,
      rawHeaders,
    };
  }

  @Get('private2')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  testPrivateRoute2(
    @GetUser() user,
  ) {
    return {
      ok: true,
      user,
    }
  }

  @Get('private3')
  @Auth(ValidRoles.superUser)
  testPrivateRoute3(
    @GetUser() user,
  ) {
    return {
      ok: true,
      user,
    }
  }
}
