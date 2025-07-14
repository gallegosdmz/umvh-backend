import { Type } from "class-transformer";
import { IsDateString, IsInt, IsString, MaxLength } from "class-validator";

export class CreateFinalGradeDto {
    @IsInt()
    @Type(() => Number)
    grade: number;

    @IsInt()
    @Type(() => Number)
    gradeOrdinary: number;

    @IsInt()
    @Type(() => Number)
    gradeExtraordinary: number;

    @IsDateString()
    date: Date;

    @IsString()
    @MaxLength(50)
    type: string;

    @IsInt()
    @Type(() => Number)
    courseGroupStudentId: number;
}
