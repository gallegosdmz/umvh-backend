import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { FinalGradesService } from './final-grades.service';
import { CreateFinalGradeDto } from './dto/create-final-grade.dto';
import { UpdateFinalGradeDto } from './dto/update-final-grade.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('final-grades')
export class FinalGradesController {
  constructor(private readonly finalGradesService: FinalGradesService) {}

  @Post()
  create(@Body() createFinalGradeDto: CreateFinalGradeDto, @GetUser() user: User) {
    return this.finalGradesService.create(createFinalGradeDto, user);
  }

  @Get('findAll/:courseGroupStudentId')
  findAll(
    @Param('courseGroupStudentId', ParseIntPipe) courseGroupStudentId: number
  ) {
    return this.finalGradesService.findAll(courseGroupStudentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.finalGradesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFinalGradeDto: UpdateFinalGradeDto) {
    return this.finalGradesService.update(id, updateFinalGradeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finalGradesService.remove(id);
  }
}
