import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Auth } from 'src/users/decorators/auth.decorator';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Auth(ValidRoles.administrador)
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findAll(
    @Query() paginationDto: PaginationDto
  ) {
    return this.groupsService.findAll(paginationDto);
  }

  @Get('findAllForDirector')
  @Auth(ValidRoles.administrador, ValidRoles.director)
  findAllForDirector(
    @Query() paginationDto: PaginationDto
  ) {
    return this.groupsService.findAllForDirector(paginationDto);
  }

  @Get(':groupId/find-boletas')
  @Auth(ValidRoles.administrador, ValidRoles.director)
  findBoletas(
    @Param('groupId') groupId: number
  ) {
    return this.groupsService.findBoletas(groupId);
  }

  @Get('count')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  count() {
    return this.groupsService.countTotal();
  } 

  @Get(':id')
  @Auth(ValidRoles.administrador, ValidRoles.maestro, ValidRoles.director)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.administrador)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.administrador)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
