import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { PartialGradesService } from './partial-grades.service';
import { CreatePartialGradeDto } from './dto/create-partial-grade.dto';
import { UpdatePartialGradeDto } from './dto/update-partial-grade.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Auth } from 'src/users/decorators/auth.decorator';
import { ValidRoles } from 'src/users/interfaces/valid-roles';

@Controller('partial-grades')
export class PartialGradesController {
  constructor(private readonly partialGradesService: PartialGradesService) {}

  @Post()
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  create(@Body() createPartialGradeDto: CreatePartialGradeDto, @GetUser() user: User) {
    return this.partialGradesService.create(createPartialGradeDto, user);
  }

  @Get('findAll/:courseGroupStudentId')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  findAll(
    @Param('courseGroupStudentId', ParseIntPipe) courseGroupStudentId: number,
    @Query('partial', ParseIntPipe) partial: number
  ) {
    return this.partialGradesService.findAll(courseGroupStudentId, partial);
  }

  @Get(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partialGradesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePartialGradeDto: UpdatePartialGradeDto) {
    return this.partialGradesService.update(id, updatePartialGradeDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.administrador)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partialGradesService.remove(id);
  }
}
