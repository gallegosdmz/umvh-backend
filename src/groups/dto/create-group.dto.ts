import { Type } from "class-transformer";
import { IsInt, IsString, MaxLength } from "class-validator";

export class CreateGroupDto {
    @IsString()
    @MaxLength(50)
    name: string;

    @IsInt()
    @Type(() => Number)
    periodId: number;

    @IsInt()
    @Type(() => Number)
    semester: number;
}
