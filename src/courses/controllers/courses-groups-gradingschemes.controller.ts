import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { CoursesGroupsGradingschemesService } from "../services/courses-groups-gradingschemes.service";
import { Auth } from "src/users/decorators/auth.decorator";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { CreateCourseGroupGradingschemeDto } from "../dto/create-course-group-gradingscheme.dto";
import { UpdateCourseGroupGradingschemeDto } from "../dto/update-course-group-gradingscheme.dto";

@Controller('courses-groups-gradingschemes')
export class CoursesGroupsGradingschemesController {
    constructor(private readonly coursesGroupsGradingschemesService: CoursesGroupsGradingschemesService){}

    @Post()
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    create(@Body() createCourseGroupGradingschemeDto: CreateCourseGroupGradingschemeDto) {
        return this.coursesGroupsGradingschemesService.create(createCourseGroupGradingschemeDto);
    }

    @Get(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
    findOne(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.coursesGroupsGradingschemesService.findOne(id);
    }

    @Patch(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCourseGroupGradingschemeDto: UpdateCourseGroupGradingschemeDto
    ) {
        return this.coursesGroupsGradingschemesService.update(id, updateCourseGroupGradingschemeDto);
    }

    @Delete('id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.coursesGroupsGradingschemesService.remove(id);
    }
}