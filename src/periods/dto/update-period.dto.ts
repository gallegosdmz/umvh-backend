import { PartialType } from '@nestjs/swagger';
import { CreatePeriodDto } from './create-period.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePeriodDto extends PartialType(CreatePeriodDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
