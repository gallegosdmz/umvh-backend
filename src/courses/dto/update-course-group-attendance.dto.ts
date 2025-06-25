import { PartialType } from '@nestjs/swagger';
import { CreateCourseGroupAttendanceDto } from './create-course-group-attendance.dto';

export class UpdateCourseGroupAttendanceDto extends PartialType(CreateCourseGroupAttendanceDto) {} 