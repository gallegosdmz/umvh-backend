import { IsString, MaxLength, IsDateString } from "class-validator";

export class CreatePeriodDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;
}
