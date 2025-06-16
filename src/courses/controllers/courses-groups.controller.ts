import { Controller, Post, Body, Patch, Param, Delete, ParseIntPipe, Get, Query } from "@nestjs/common";
import { CoursesGroupsService } from "../services/courses-groups.service";
import { CreateCourseGroupDto } from "../dto/create-course-group.dto";
import { UpdateCourseGroupDto } from "../dto/update-course-group.dto";
import { Auth } from "src/users/decorators/auth.decorator";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { PaginationDto } from "src/core/dtos/pagination.dto";

@Controller('courses-groups')
export class CoursesGroupsController {
    constructor(private readonly coursesGroupsService: CoursesGroupsService) {}

    @Post()
    @Auth(ValidRoles.administrador)
    create(@Body() createCourseGroupDto: CreateCourseGroupDto) {
        return this.coursesGroupsService.create(createCourseGroupDto);
    }

    @Get(':courseId')
    @Auth(ValidRoles.administrador)
    findAll(
        @Param('courseId', ParseIntPipe) courseId: number,
        @Query() paginationDto: PaginationDto
    ) {
        return this.coursesGroupsService.findAllByCourse(courseId, paginationDto);
    }

    @Patch(':id')
    @Auth(ValidRoles.administrador)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCourseGroupDto: UpdateCourseGroupDto
    ) {
        return this.coursesGroupsService.update(id, updateCourseGroupDto);
    }

    @Delete(':id')
    @Auth(ValidRoles.administrador)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.coursesGroupsService.remove(id);
    }
}