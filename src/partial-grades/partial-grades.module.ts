import { Module } from '@nestjs/common';
import { PartialGradesService } from './partial-grades.service';
import { PartialGradesController } from './partial-grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartialGrade } from './entities/partial-grade.entity';
import { UsersModule } from 'src/users/users.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  controllers: [PartialGradesController],
  providers: [PartialGradesService],
  imports: [
    TypeOrmModule.forFeature([PartialGrade]),
    UsersModule,
    CoursesModule,
  ],
  exports: [PartialGradesService],
})
export class PartialGradesModule {}
