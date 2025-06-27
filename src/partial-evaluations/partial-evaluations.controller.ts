import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PartialEvaluationsService } from './partial-evaluations.service';
import { CreatePartialEvaluationDto } from './dto/create-partial-evaluation.dto';
import { UpdatePartialEvaluationDto } from './dto/update-partial-evaluation.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('partial-evaluations')
export class PartialEvaluationsController {
  constructor(private readonly partialEvaluationsService: PartialEvaluationsService) {}

  @Post()
  create(@Body() createPartialEvaluationDto: CreatePartialEvaluationDto, @GetUser() user: User) {
    return this.partialEvaluationsService.create(createPartialEvaluationDto, user);
  }

  @Get(':courseGroupStudentId')
  findAll(
    @Param('courseGroupStudentId', ParseIntPipe) courseGroupStudentId: number
  ) {
    return this.partialEvaluationsService.findAll(courseGroupStudentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partialEvaluationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePartialEvaluationDto: UpdatePartialEvaluationDto) {
    return this.partialEvaluationsService.update(id, updatePartialEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partialEvaluationsService.remove(id);
  }
}
