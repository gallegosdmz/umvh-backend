import { IsString, MaxLength, IsDateString, IsOptional, IsBoolean } from "class-validator";

export class CreatePeriodDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsBoolean()
    firstPartialActive: boolean;

    @IsOptional()
    @IsBoolean()
    secondPartialActive: boolean;

    @IsOptional()
    @IsBoolean()
    thirdPartialActive: boolean;
}
