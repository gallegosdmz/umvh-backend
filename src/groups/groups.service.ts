import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { PeriodsService } from 'src/periods/periods.service';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,

    private readonly periodService: PeriodsService,
  ) { }

  async create(createGroupDto: CreateGroupDto) {
    const { periodId, ...data } = createGroupDto;
    const period = await this.periodService.findOne(periodId);

    try {
      const group = this.groupRepository.create({
        ...data,
        period
      });
      await this.groupRepository.save(group);

      return group;

    } catch (error) {
      handleDBErrors(error, 'create - groups');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    // TODO: HACER COMPROBACIÓN PARA TRAER SOLO LOS GRUPOS A LOS QUE PERTENEZCA EN CASO DE QUE SEA MAESTRO

    return await this.groupRepository.find({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
      relations: {
        coursesGroups: { course: true, user: true },
        period: true,
      },
    });
  }

  async findOne(id: number) {
    // TODO: HACER COMPROBACIÓN PARA TRAER SOLO LOS GRUPOS A LOS QUE PERTENEZCA EN CASO DE QUE SEA MAESTRO

    const group = await this.groupRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        coursesGroups: { course: true, user: true },
        period: true,
      },
    });
    if (!group) throw new NotFoundException(`Group with id: ${id} not found`);

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    const { periodId, name, semester } = updateGroupDto;

    const group = await this.findOne(id);

    if (periodId) {
      const period = await this.periodService.findOne(id);
      group.period = period;
    }

    if (name) group.name = name;
    if (semester) group.semester = semester;

    try {
      await this.groupRepository.save(group);
      return group;

    } catch (error) {
      handleDBErrors(error, 'update - groups');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.groupRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - groups');
    }
  }
}
