import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber } from "class-validator";

export class CreatePartialGradeDto {
    @IsInt()
    @Type(() => Number)
    partial: number;

    @IsNumber()
    grade: number;

    @IsDateString()
    date: Date;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}
