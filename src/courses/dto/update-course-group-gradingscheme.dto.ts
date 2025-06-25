import { PartialType } from '@nestjs/swagger';
import { CreateCourseGroupGradingschemeDto } from './create-course-group-gradingscheme.dto';

export class UpdateCourseGroupGradingschemeDto extends PartialType(CreateCourseGroupGradingschemeDto) {}