import { Module } from '@nestjs/common';
import { CoursesService } from './services/courses.service';
import { CoursesController } from './controllers/courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { UsersModule } from 'src/users/users.module';
import { CourseGroup } from './entities/course-group.entity';
import { CoursesGroupsController } from './controllers/courses-groups.controller';
import { CoursesGroupsService } from './services/courses-groups.service';
import { GroupsModule } from 'src/groups/groups.module';
import { CourseValidator } from './validators/course.validator';

@Module({
  controllers: [CoursesController, CoursesGroupsController],
  providers: [CoursesService, CoursesGroupsService, CourseValidator],
  imports: [
    TypeOrmModule.forFeature([Course, CourseGroup]),
    UsersModule,
    GroupsModule,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
