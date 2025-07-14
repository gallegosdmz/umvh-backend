import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PartialEvaluationsService } from './partial-evaluations.service';
import { CreatePartialEvaluationDto } from './dto/create-partial-evaluation.dto';
import { UpdatePartialEvaluationDto } from './dto/update-partial-evaluation.dto';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Auth } from 'src/users/decorators/auth.decorator';
import { ValidRoles } from 'src/users/interfaces/valid-roles';

@Controller('partial-evaluations')
export class PartialEvaluationsController {
  constructor(private readonly partialEvaluationsService: PartialEvaluationsService) {}

  @Post()
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  create(@Body() createPartialEvaluationDto: CreatePartialEvaluationDto, @GetUser() user: User) {
    return this.partialEvaluationsService.create(createPartialEvaluationDto, user);
  }

  @Get(':courseGroupStudentId')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  findAll(
    @Param('courseGroupStudentId', ParseIntPipe) courseGroupStudentId: number
  ) {
    return this.partialEvaluationsService.findAll(courseGroupStudentId);
  }

  @Get(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partialEvaluationsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePartialEvaluationDto: UpdatePartialEvaluationDto) {
    return this.partialEvaluationsService.update(id, updatePartialEvaluationDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.administrador)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partialEvaluationsService.remove(id);
  }
}
