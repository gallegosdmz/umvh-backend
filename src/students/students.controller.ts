import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Auth } from 'src/users/decorators/auth.decorator';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Post()
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findAllByUser(
    @Query() paginationDto: PaginationDto,
  ) {
    return this.studentsService.findAll(paginationDto);
  }

  @Get('count')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  count() {
    return this.studentsService.countTotal();
  }

  @Get('not-in-course-group/:courseGroupId')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findStudentsNotInCourseGroup(
    @Param('courseGroupId', ParseIntPipe) courseGroupId: number,
    @Query() paginationDto: PaginationDto
  ) {
    return this.studentsService.findStudentsNotInCourseGroup(
      courseGroupId,
      paginationDto
    );
  }

  @Get(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.administrador)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
