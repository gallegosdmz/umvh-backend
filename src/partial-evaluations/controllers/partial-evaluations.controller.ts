import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PartialEvaluationsService } from '../services/partial-evaluations.service';
import { CreatePartialEvaluationDto } from '../dto/create-partial-evaluation.dto';
import { UpdatePartialEvaluationDto } from '../dto/update-partial-evaluation.dto';
import { Auth } from 'src/users/decorators/auth.decorator';
import { ValidRoles } from 'src/users/interfaces/valid-roles';

@Controller('partial-evaluations')
export class PartialEvaluationsController {
  constructor(private readonly partialEvaluationsService: PartialEvaluationsService) {}

  @Post()
  @Auth(ValidRoles.administrador, ValidRoles.maestro)
  create(@Body() createPartialEvaluationDto: CreatePartialEvaluationDto) {
    return this.partialEvaluationsService.create(createPartialEvaluationDto);
  }

  @Get(':courseGroupId')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findAll(
    @Param('courseGroupId', ParseIntPipe) courseGroupId: number
  ) {
    return this.partialEvaluationsService.findAll(courseGroupId);
  }

  @Get(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
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
