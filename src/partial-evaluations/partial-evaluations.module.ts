import { Module } from '@nestjs/common';
import { PartialEvaluationsService } from './services/partial-evaluations.service';
import { PartialEvaluationsController } from './controllers/partial-evaluations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartialEvaluation } from './entities/partial-evaluation.entity';
import { CoursesModule } from 'src/courses/courses.module';
import { UsersModule } from 'src/users/users.module';
import { PeriodsModule } from 'src/periods/periods.module';
import { PartialEvaluationGradeService } from './services/partial-evaluation-grade.service';
import { PartialEvaluationGradesController } from './controllers/partial-evaluation-grade.controller';
import { PartialEvaluationGrade } from './entities/partial-evaluation-grade.entity';

@Module({
  controllers: [PartialEvaluationsController, PartialEvaluationGradesController],
  providers: [PartialEvaluationsService, PartialEvaluationGradeService],
  imports: [
    TypeOrmModule.forFeature([PartialEvaluation, PartialEvaluationGrade]),
    UsersModule,
    CoursesModule,
    PeriodsModule,
  ],
  exports: [PartialEvaluationsService, PartialEvaluationGradeService],
})
export class PartialEvaluationsModule {}
