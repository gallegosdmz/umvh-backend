import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PartialGradesService } from './partial-grades.service';
import { CreatePartialGradeDto } from './dto/create-partial-grade.dto';
import { UpdatePartialGradeDto } from './dto/update-partial-grade.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('partial-grades')
export class PartialGradesController {
  constructor(private readonly partialGradesService: PartialGradesService) {}

  @Post()
  create(@Body() createPartialGradeDto: CreatePartialGradeDto, @GetUser() user: User) {
    return this.partialGradesService.create(createPartialGradeDto, user);
  }

  @Get('findAll/:courseGroupStudentId')
  findAll(
    @Param('courseGroupStudentId', ParseIntPipe) courseGroupStudentId: number
  ) {
    return this.partialGradesService.findAll(courseGroupStudentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partialGradesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePartialGradeDto: UpdatePartialGradeDto) {
    return this.partialGradesService.update(id, updatePartialGradeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partialGradesService.remove(id);
  }
}
