import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Period } from './entities/period.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(Period)
    private readonly periodRepository: Repository<Period>,
  ) {}

  async create(createPeriodDto: CreatePeriodDto) {
    try {
      const adjustedDto = {
        ...createPeriodDto,
        startDate: this.adjustDate(createPeriodDto.startDate),
        endDate: this.adjustDate(createPeriodDto.endDate),
      };

      const period = this.periodRepository.create(adjustedDto);
      await this.periodRepository.save(period);

      return period;

    } catch (error) {
      handleDBErrors(error, 'create - periods');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.periodRepository.find({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number) {
    const period = await this.periodRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!period) throw new NotFoundException(`Period with id: ${ id } not found`);

    return period;
  }

  async update(id: number, updatePeriodDto: UpdatePeriodDto) {
    const adjustedDto = {
      ...updatePeriodDto,
      ...(updatePeriodDto.startDate && {
        startDate: this.adjustDate(updatePeriodDto.startDate)
      }),
      ...(updatePeriodDto.endDate && {
        endDate: this.adjustDate(updatePeriodDto.endDate)
      })
    };

    const period = await this.periodRepository.preload({
      id,
      ...adjustedDto,
    });
    if (!period) throw new NotFoundException(`Period with id: ${ id } not found`);

    try {
      await this.periodRepository.save(period);
      return period;

    } catch (error) {
      handleDBErrors(error, 'update - periods');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.periodRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - periods');
    }
  }

  private adjustDate(dateString: string): Date {
    // Asegurarnos de que la fecha se interprete en UTC y compense el desplazamiento
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    // Añadir un día para compensar el desplazamiento de zona horaria
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }
}
