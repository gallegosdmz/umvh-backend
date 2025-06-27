import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePartialEvaluationDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name: string;

    @IsNumber()
    grade: number;

    @IsString()
    type: string;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}
