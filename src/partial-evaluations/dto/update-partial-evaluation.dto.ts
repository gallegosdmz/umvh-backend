import { PartialType } from '@nestjs/swagger';
import { CreatePartialEvaluationDto } from './create-partial-evaluation.dto';

export class UpdatePartialEvaluationDto extends PartialType(CreatePartialEvaluationDto) {}
