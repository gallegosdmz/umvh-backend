import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class CreateCourseGroupStudentDto {
    @IsInt()
    @Type(() => Number)
    courseGroupId: number;

    @IsInt()
    @Type(() => Number)
    studentId: number;
}