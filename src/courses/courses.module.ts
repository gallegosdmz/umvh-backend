import { Module, forwardRef } from '@nestjs/common';
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
import { CoursesGroupsStudentsController } from './controllers/courses-groups-students.controller';
import { CoursesGroupsStudentsService } from './services/courses-groups-students.service';
import { CourseGroupStudent } from './entities/course-group-student.entity';
import { StudentsModule } from 'src/students/students.module';
import { CoursesGroupsGradingschemesController } from './controllers/courses-groups-gradingschemes.controller';
import { CoursesGroupsGradingschemesService } from './services/courses-groups-gradingschemes.service';
import { CourseGroupGradingscheme } from './entities/course-group-gradingscheme.entity';
import { CourseGroupAttendance } from './entities/course-group-attendance.entity';
import { CoursesGroupsAttendancesService } from './services/courses-groups-attendances.service';
import { CoursesGroupsAttendancesController } from './controllers/courses-groups-attendances.controller';

@Module({
  controllers: [
    CoursesController, 
    CoursesGroupsController, 
    CoursesGroupsStudentsController,
    CoursesGroupsGradingschemesController,
    CoursesGroupsAttendancesController,
  ],
  providers: [
    CoursesService, 
    CoursesGroupsService, 
    CoursesGroupsStudentsService,
    CoursesGroupsGradingschemesService,
    CoursesGroupsAttendancesService,
    CourseValidator
  ],
  imports: [
    TypeOrmModule.forFeature([
      Course, 
      CourseGroup, 
      CourseGroupStudent, 
      CourseGroupGradingscheme,
      CourseGroupAttendance,
    ]),
    UsersModule,
    GroupsModule,
    forwardRef(() => StudentsModule)
  ],
  exports: [CoursesService, CoursesGroupsService, CoursesGroupsStudentsService, CoursesGroupsGradingschemesService, CoursesGroupsAttendancesService],
})
export class CoursesModule {}
