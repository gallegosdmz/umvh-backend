import { IsInt, IsString, MaxLength } from "class-validator";

export class CreateStudentDto {
    @IsString()
    @MaxLength(100)
    fullName: string;

    @IsInt()
    semester: number;

    @IsString()
    @MaxLength(20)
    registrationNumber: string;
}
