import { IsString, MaxLength } from "class-validator";
import { IsPassword } from "../decorators/is-valid-password.decorator";
import { IsRole } from "../decorators/is-valid-role.decorator";

export class CreateUserDto {
    @IsString()
    @MaxLength(100)
    fullName: string;

    @IsString()
    @MaxLength(100)
    email: string;

    @IsString()
    @IsPassword()
    password: string;

    @IsString()
    @IsRole()
    role: string;
}
