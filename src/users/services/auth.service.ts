import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { CreateUserDto } from "../dto/create-user.dto";
import { handleDBErrors } from "src/utils/errors";
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from "../dto/login-user.dto";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { UserValidator } from "../validators/user.validator";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly userValidator: UserValidator,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const {password, ...userData} = createUserDto;
        await this.userValidator.verifyUserEmail(userData.email);

        try {
            const user = this.userRepository.create({
                ...userData,
                password: bcrypt.hashSync(password, 10),
            });
            await this.userRepository.save(user);

            const {password: _, ...data} = user;

            return {
                ...data,
                role: data.role,    
                token: this.getJwtToken({id: user.id}),
            }

        } catch (error) {
            console.log('SALIO ERROR EN EL SERVICE: ', error);
            handleDBErrors(error, 'create - auth');
        }
    }

    async login(loginUserDto: LoginUserDto) {
        const {password, email} = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email, isDeleted: false },
        });
        if (!user) throw new UnauthorizedException('Credentials are not valid (email)');
        if (!bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Credentials are not valid (password)');

        const {password: _, ...data} = user;

        return {
            ...data,
            role: data.role, 
            token: this.getJwtToken({id: user.id}),
        }
    }

    async changePassword(id: number, changePassword: ChangePasswordDto, user: User) {
        const userToEdit = await this.userRepository.findOne({
            where: { id, isDeleted: false },
            select: { id: true, password: true },
        });
        if (!userToEdit) throw new NotFoundException(`User with id: ${ id } not found`);

        await this.userValidator.verifyUserOwnerToPassword(userToEdit, user);

        try {
            const newPassword = bcrypt.hashSync(changePassword.password, 10);
            await this.userRepository.update(id, {password: newPassword });

            return {
                message: 'Password update successfuly',
            }

        } catch (error) {
            handleDBErrors(error, 'changePassword - auth');
        }
    }

    async checkAuthStatus(user: User) {
        return {
            ...user,
            token: this.getJwtToken({id: user.id}),
        };
    }

    private getJwtToken(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }
}