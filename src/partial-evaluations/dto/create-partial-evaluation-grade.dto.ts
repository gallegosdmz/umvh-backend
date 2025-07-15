import { Type } from "class-transformer";
import { IsInt, IsNumber } from "class-validator";

export class CreatePartialEvaluationGradeDto {
    @IsNumber()
    grade: number;

    @IsInt()
    @Type(() => Number)
    partialEvaluationId: number;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}