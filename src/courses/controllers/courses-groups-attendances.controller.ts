import { Body, Controller, Param, ParseIntPipe, Patch, Post, Get, Query } from "@nestjs/common";
import { CoursesGroupsAttendancesService } from "../services/courses-groups-attendances.service";
import { Auth } from "src/users/decorators/auth.decorator";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { CreateCourseGroupAttendanceDto } from "../dto/create-course-group-attendance.dto";
import { GetUser } from "src/users/decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";
import { UpdateCourseGroupAttendanceDto } from "../dto/update-course-group-attendance.dto";

@Controller('courses-groups-attendances')
export class CoursesGroupsAttendancesController {
    constructor(private readonly coursesGroupsAttendancesService: CoursesGroupsAttendancesService) {}

    @Post()
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    create(
        @Body() createCourseGroupAttendanceDto: CreateCourseGroupAttendanceDto,
        @GetUser() user: User
    ) {
        return this.coursesGroupsAttendancesService.create(createCourseGroupAttendanceDto, user);
    }

    @Get(':courseGroupId')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    findAllByCourseGroupAndDate(
        @Param('courseGroupId', ParseIntPipe) courseGroupId: number,
        @Query('date') date: Date
    ) {
        return this.coursesGroupsAttendancesService.findAllByCourseGroupAndDate(courseGroupId, date);
    }

    @Patch(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCourseGroupAttendanceDto: UpdateCourseGroupAttendanceDto,
        @GetUser() user: User
    ) {
        return this.coursesGroupsAttendancesService.update(id, updateCourseGroupAttendanceDto, user);
    }
}