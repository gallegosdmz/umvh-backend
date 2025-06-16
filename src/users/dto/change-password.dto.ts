import { IsString } from "class-validator";
import { IsPassword } from "../decorators/is-valid-password.decorator";

export class ChangePasswordDto {
    @IsString()
    @IsPassword()
    password: string;
}