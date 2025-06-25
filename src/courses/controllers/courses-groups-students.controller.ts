import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { CoursesGroupsStudentsService } from "../services/courses-groups-students.service";
import { Auth } from "src/users/decorators/auth.decorator";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { CreateCourseGroupStudentDto } from "../dto/create-course-group-student.dto";
import { PaginationDto } from "src/core/dtos/pagination.dto";
import { GetUser } from "src/users/decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";

@Controller('courses-groups-students')
export class CoursesGroupsStudentsController {
    constructor(private readonly coursesGroupsStudentsService: CoursesGroupsStudentsService) {}

    @Post()
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    create(
        @Body() createCourseGroupStudentDto: CreateCourseGroupStudentDto,
        @GetUser() user: User
    ) {
        return this.coursesGroupsStudentsService.create(createCourseGroupStudentDto, user);
    }

    @Get('findAll/:courseGroupId')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    findAllByCourseGroup(
        @Param('courseGroupId', ParseIntPipe) courseGroupId: number,
        @Query() paginationDto: PaginationDto,
        @GetUser() user: User
    ) {
        return this.coursesGroupsStudentsService.findAllByCourseGroup(courseGroupId, paginationDto, user);
    }

    @Get(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @GetUser() user: User
    ) {
        return this.coursesGroupsStudentsService.findOne(id, user);
    }

    @Delete(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    remove(
        @Param('id', ParseIntPipe) id: number,
        @GetUser() user: User
    ) {
        return this.coursesGroupsStudentsService.remove(id, user);
    }
}