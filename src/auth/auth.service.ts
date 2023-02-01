import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { SignInDto } from "./dto/signIn.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createAuthDto: CreateAuthDto) {
    try {
      const { password, email, ...userData } = createAuthDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });
      await this.userRepository.save(user);
      delete user.password;
      return {
        ...user,
        token: this.getJwtToken({ userId: user.id })
      };
    } catch(error) {
      this.handleDBErrors(error);
    }
  }

  async signIn(signInDto: SignInDto) {
    const { password, email } = signInDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true }
    });

    // ERROR: User not found!
    if(!user) {
      throw new UnauthorizedException('Credentials are not valid! [email]');
    }

    if(!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials are not valid! [password]');
    }

    return { ...user, token: this.getJwtToken({ userId: user.id }) }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if(error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    console.log(error);
    throw new InternalServerErrorException('Fatal error, please check logs!');
  }
}
