import { Module, forwardRef } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { UsersModule } from 'src/users/users.module';
import { CoreModule } from 'src/core/core.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  imports: [
    TypeOrmModule.forFeature([Student]),
    UsersModule,
    CoreModule,
    forwardRef(() => CoursesModule),
  ], 
  exports: [StudentsService],
})
export class StudentsModule {}
