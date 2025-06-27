import { Module } from '@nestjs/common';
import { PartialEvaluationsService } from './partial-evaluations.service';
import { PartialEvaluationsController } from './partial-evaluations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartialEvaluation } from './entities/partial-evaluation.entity';
import { CoursesModule } from 'src/courses/courses.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [PartialEvaluationsController],
  providers: [PartialEvaluationsService],
  imports: [
    TypeOrmModule.forFeature([PartialEvaluation]),
    UsersModule,
    CoursesModule,
  ],
  exports: [PartialEvaluationsService],
})
export class PartialEvaluationsModule {}
