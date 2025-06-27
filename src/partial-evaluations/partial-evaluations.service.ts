import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartialEvaluationDto } from './dto/create-partial-evaluation.dto';
import { UpdatePartialEvaluationDto } from './dto/update-partial-evaluation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PartialEvaluation } from './entities/partial-evaluation.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { CoursesGroupsStudentsService } from 'src/courses/services/courses-groups-students.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PartialEvaluationsService {
  constructor(
    @InjectRepository(PartialEvaluation)
    private readonly partialEvaluationRepository: Repository<PartialEvaluation>,

    private readonly courseGroupStudentService: CoursesGroupsStudentsService,
  ) {}

  async create(createPartialEvaluationDto: CreatePartialEvaluationDto, user: User) {
    const { courseGroupStudentId, ...data } = createPartialEvaluationDto;
    
    const courseGroupStudent = await this.courseGroupStudentService.findOne(courseGroupStudentId, user);
    
    try {
      const partialEvaluation = this.partialEvaluationRepository.create({
        courseGroupStudent,
        ...data
      });
      await this.partialEvaluationRepository.save(partialEvaluation);

      return partialEvaluation;

    } catch (error) {
      handleDBErrors(error, 'create - partialEvaluations');
    }
  }

  async findAll(courseGroupStudentId: number) {
    try {
      return await this.partialEvaluationRepository.find({
        where: { courseGroupStudent: { id: courseGroupStudentId }, isDeleted: false },
      });

    } catch (error) {
      handleDBErrors(error, 'findAll - partialEvaluations');
    }
  }

  async findOne(id: number) {
    const partialEvaluation = await this.partialEvaluationRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!partialEvaluation) throw new NotFoundException(`Partial evaluation with id: ${ id } not found`);

    return partialEvaluation;
  }

  async update(id: number, updatePartialEvaluationDto: UpdatePartialEvaluationDto) {
    const { courseGroupStudentId, ...data } = updatePartialEvaluationDto;
    const partialEvaluation = await this.partialEvaluationRepository.preload({
      id,
      ...data
    });
    if (!partialEvaluation) throw new NotFoundException(`Partial evaluation with id: ${ id } not found`);

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
      await this.partialEvaluationRepository.update(id, { isDeleted: false });

    } catch (error) {
      handleDBErrors(error, 'remove - partialEvaluation');
    }
  }
}
