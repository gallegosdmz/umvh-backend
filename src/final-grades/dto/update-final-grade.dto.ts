import { PartialType } from '@nestjs/swagger';
import { CreateFinalGradeDto } from './create-final-grade.dto';

export class UpdateFinalGradeDto extends PartialType(CreateFinalGradeDto) {}
