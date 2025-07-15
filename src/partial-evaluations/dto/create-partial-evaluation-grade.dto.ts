import { Type } from "class-transformer";
import { IsInt, IsNumber } from "class-validator";

export class CreatePartialEvaluationGradeDto {
    @IsInt()
    @Type(() => Number)
    partial: number;

    @IsNumber()
    grade: number;

    @IsInt()
    @Type(() => Number)
    partialEvaluationId: number;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}