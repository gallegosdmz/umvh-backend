import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePartialEvaluationDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name: string;

    @IsString()
    type: string;

    @IsInt()
    @Type(() => Number)
    slot: number;

    @IsInt()
    @Type(() => Number)
    courseGroupId: number;
}
