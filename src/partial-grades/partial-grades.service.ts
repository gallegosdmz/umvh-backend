import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePartialGradeDto } from './dto/create-partial-grade.dto';
import { UpdatePartialGradeDto } from './dto/update-partial-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PartialGrade } from './entities/partial-grade.entity';
import { Repository } from 'typeorm';
import { CoursesGroupsStudentsService } from 'src/courses/services/courses-groups-students.service';
import { User } from 'src/users/entities/user.entity';
import { handleDBErrors } from 'src/utils/errors';

@Injectable()
export class PartialGradesService {
  constructor(
    @InjectRepository(PartialGrade)
    private readonly partialGradeRepository: Repository<PartialGrade>,

    private readonly courseGroupStudentService: CoursesGroupsStudentsService,
  ) {}

  async create(createPartialGradeDto: CreatePartialGradeDto, user: User) {
    const { courseGroupStudentId, partial, ...data } = createPartialGradeDto;

    const courseGroupStudent = await this.courseGroupStudentService.findOne(courseGroupStudentId, user);

    // Validar que no exista ya un partial-grade con el mismo courseGroupStudentId y partial
    const existingPartialGrade = await this.partialGradeRepository.findOne({
      where: {
        courseGroupStudent: { id: courseGroupStudentId },
        partial,
        isDeleted: false,
      },
    });

    if (existingPartialGrade) {
      throw new BadRequestException(
        `Ya existe una calificación parcial para este estudiante en el parcial ${partial}`
      );
    }

    try {
      const partialGrade = this.partialGradeRepository.create({
        courseGroupStudent,
        partial,
        ...data,
      });
      await this.partialGradeRepository.save(partialGrade);

      return partialGrade;

    } catch (error) {
      handleDBErrors(error, 'create - partialGrades');
    }
  }

  async findAll(courseGroupStudentId: number, partial: number) {
    try {
      return await this.partialGradeRepository.find({
        where: { partial, isDeleted: false, courseGroupStudent: { id: courseGroupStudentId } }
      });
    } catch (error) {
      handleDBErrors(error, 'findAll - partialGrades');
    }
  }

  async findOne(id: number) {
    const partialGrade = await this.partialGradeRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!partialGrade) throw new NotFoundException(`Partial Grade with id: ${ id } not found`);

    return partialGrade;
  }

  async update(id: number, updatePartialGradeDto: UpdatePartialGradeDto) {
    const { courseGroupStudentId, ...data } = updatePartialGradeDto;

    const partialGrade = await this.partialGradeRepository.preload({
      id,
      ...data,
      date: new Date(), // Actualizar automáticamente la fecha con la fecha actual
    });
    if (!partialGrade) throw new NotFoundException(`Partial Grade with id: ${ id } not found`);

    try {
      await this.partialGradeRepository.save(partialGrade);
      return partialGrade;

    } catch (error) {
      handleDBErrors(error, 'update - partialGrade');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.partialGradeRepository.update(id, { isDeleted: true })
      
    } catch (error) {
      handleDBErrors(error, 'remove - partialGrades');
    }
  }
}
