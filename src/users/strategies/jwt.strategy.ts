import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ) {
    constructor(
        @InjectRepository( User )
        private readonly userRepository: Repository<User>,

        configService: ConfigService
    ) {
        
        super({
            secretOrKey: configService.get('JWT_SECRET') || 'default_secret',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }
    
    async validate( payload: JwtPayload ): Promise<User> {
        const { id } = payload;

        const user = await this.userRepository.findOne({
            where: {
                id,
            },
        });

        if ( !user )
            throw new UnauthorizedException('Token not valid');

        if ( user.isDeleted )
            throw  new UnauthorizedException('User is inactive, talk with admin');
    
        return user;
    }
}