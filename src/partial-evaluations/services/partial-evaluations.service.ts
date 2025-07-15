import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreatePartialEvaluationDto } from '../dto/create-partial-evaluation.dto';
import { UpdatePartialEvaluationDto } from '../dto/update-partial-evaluation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PartialEvaluation } from '../entities/partial-evaluation.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { CoursesGroupsService } from 'src/courses/services/courses-groups.service';
import { PeriodsService } from 'src/periods/periods.service';

@Injectable()
export class PartialEvaluationsService {
  constructor(
    @InjectRepository(PartialEvaluation)
    private readonly partialEvaluationRepository: Repository<PartialEvaluation>,

    private readonly periodService: PeriodsService,
    private readonly courseGroup: CoursesGroupsService,
  ) { }

  async create(createPartialEvaluationDto: CreatePartialEvaluationDto) {
    const { courseGroupId, ...data } = createPartialEvaluationDto;

    const courseGroup = await this.courseGroup.findOne(courseGroupId);

    try {
      const partialEvaluation = this.partialEvaluationRepository.create({
        courseGroup,
        ...data
      });
      await this.partialEvaluationRepository.save(partialEvaluation);

      return partialEvaluation;

    } catch (error) {
      handleDBErrors(error, 'create - partialEvaluations');
    }
  }

  async findAll(courseGroupId: number) {
    try {
      return await this.partialEvaluationRepository.find({
        where: { courseGroup: { id: courseGroupId } },
        relations: [
          'courseGroup',
          'courseGroup.coursesGroupsStudents',
          'courseGroup.coursesGroupsStudents.partialEvaluationGrades',
          'courseGroup.coursesGroupsStudents.partialEvaluationGrades.partialEvaluation'
        ]
      });

    } catch (error) {
      handleDBErrors(error, 'findAll - partialEvaluations');
    }
  }

  async findOne(id: number) {
    const partialEvaluation = await this.partialEvaluationRepository.findOne({
      where: { id, isDeleted: false },
      relations: { courseGroup: { group: { period: true } } },
    });
    if (!partialEvaluation) throw new NotFoundException(`Partial evaluation with id: ${id} not found`);

    return partialEvaluation;
  }

  async update(id: number, updatePartialEvaluationDto: UpdatePartialEvaluationDto) {
    const { courseGroupId, ...data } = updatePartialEvaluationDto;

    // Buscar la entidad con relaciones incluidas
    const partialEvaluation = await this.partialEvaluationRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        courseGroup: { group: { period: true }, course: true, coursesGroupsStudents: { coursesGroupsAttendances: true, student: true } }
      }
    });
    if (!partialEvaluation) throw new NotFoundException(`Partial evaluation with id: ${id} not found`);


    // Actualizar los campos
    Object.assign(partialEvaluation, data);

    try {
      await this.partialEvaluationRepository.save(partialEvaluation);

      return partialEvaluation;

    } catch (error) {
      handleDBErrors(error, 'update - partialEvaluation');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.partialEvaluationRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - partialEvaluation');
    }
  }


  private async checkStatusPeriod(periodId: number, periodPartial: number) {
    const period = await this.periodService.findOne(periodId);
    if (!period) throw new NotFoundException(`Period with id: ${ periodId } not found`);

    if (periodPartial === 1 && period.firstPartialActive ) return true;
    if (periodPartial === 2 && period.secondPartialActive ) return true;
    if (periodPartial === 3 && period.thirdPartialActive ) return true;

    throw new UnauthorizedException(`The period: ${ periodPartial } si closed`);
  }
}
