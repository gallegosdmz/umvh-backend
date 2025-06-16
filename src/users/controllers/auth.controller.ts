import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginUserDto } from "../dto/login-user.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { Auth } from "../decorators/auth.decorator";
import { ValidRoles } from "../interfaces/valid-roles";
import { GetUser } from "../decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(
        @Body() loginUserDto: LoginUserDto
    ) {
        return this.authService.login(loginUserDto);
    }

    @Patch('change-password/:id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    changePassword(
        @Param('id', ParseIntPipe ) id: number,
        @Body() changePasswordDto: ChangePasswordDto,
        @GetUser() user: User
    ) {
        return this.authService.changePassword(id, changePasswordDto, user);
    }

    @Get('check-auth-status')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    checkAuthStatus(
        @GetUser() user: User
    ) {
        return this.authService.checkAuthStatus(user);
    }
}