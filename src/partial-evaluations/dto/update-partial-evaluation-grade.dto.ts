import { PartialType } from '@nestjs/swagger';
import { CreatePartialEvaluationGradeDto } from './create-partial-evaluation-grade.dto';

export class UpdatePartialEvaluationGradeDto extends PartialType(CreatePartialEvaluationGradeDto) {}
