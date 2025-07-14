import { Type } from "class-transformer";
import { IsDateString, IsInt } from "class-validator";

export class CreatePartialGradeDto {
    @IsInt()
    @Type(() => Number)
    partial: number;

    @IsInt()
    @Type(() => Number) 
    grade: number;

    @IsDateString()
    date: Date;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}
