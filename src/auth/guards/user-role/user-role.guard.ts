import {
  CanActivate,
  ExecutionContext, ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Observable } from 'rxjs';
import { Reflector } from "@nestjs/core";
import { User } from "../../entities/user.entity";
import { META_ROLES } from "../../decorators/role-protected.decorator";

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(META_ROLES, context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if(!user) {
      throw new NotFoundException('User not found in request!');
    }

    for (const role of user.roles) {
      if(validRoles.includes(role)) {
        return true;
      }
    }

    throw new ForbiddenException(`User ${user.fullName} required to have a valid role [${validRoles}]`);
  }
}
