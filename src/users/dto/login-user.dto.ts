import { IsString, MaxLength } from "class-validator";
import { IsPassword } from "../decorators/is-valid-password.decorator";

export class LoginUserDto {
    @IsString()
    @MaxLength(100)
    email: string;

    @IsString()
    @IsPassword()
    password: string;
}