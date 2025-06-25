import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsInt } from "class-validator";

export class CreateCourseGroupAttendanceDto {
    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;

    @IsDateString()
    date: Date;

    @IsBoolean()
    attend: boolean;
}