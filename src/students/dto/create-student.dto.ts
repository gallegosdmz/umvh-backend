import { IsString, MaxLength } from "class-validator";

export class CreateStudentDto {
    @IsString()
    @MaxLength(100)
    fullName: string;

    @IsString()
    @MaxLength(20)
    registrationNumber: string;
}
