import { Module } from '@nestjs/common';
import { FinalGradesService } from './final-grades.service';
import { FinalGradesController } from './final-grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalGrade } from './entities/final-grade.entity';
import { UsersModule } from 'src/users/users.module';
import { CoursesModule } from 'src/courses/courses.module';
import { CourseGroupStudent } from 'src/courses/entities/course-group-student.entity';

@Module({
  controllers: [FinalGradesController],
  providers: [FinalGradesService],
  imports: [
    TypeOrmModule.forFeature([FinalGrade, CourseGroupStudent]),
    UsersModule,
    CoursesModule
  ],
  exports: [FinalGradesService]
})
export class FinalGradesModule {}
