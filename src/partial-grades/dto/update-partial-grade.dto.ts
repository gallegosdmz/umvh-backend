import { PartialType } from '@nestjs/swagger';
import { CreatePartialGradeDto } from './create-partial-grade.dto';

export class UpdatePartialGradeDto extends PartialType(CreatePartialGradeDto) {}
