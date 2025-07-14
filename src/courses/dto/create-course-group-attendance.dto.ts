import { Type } from "class-transformer";
import { IsDateString, IsInt } from "class-validator";

export class CreateCourseGroupAttendanceDto {
    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;

    @IsInt()
    @Type(() => Number)
    partial: number;

    @IsDateString()
    date: Date;

    @IsInt()
    @Type(() => Number)
    attend: number;
}