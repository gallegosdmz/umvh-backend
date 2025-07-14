import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFinalGradeDto } from './dto/create-final-grade.dto';
import { UpdateFinalGradeDto } from './dto/update-final-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FinalGrade } from './entities/final-grade.entity';
import { Repository } from 'typeorm';
import { CoursesGroupsStudentsService } from 'src/courses/services/courses-groups-students.service';
import { handleDBErrors } from 'src/utils/errors';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class FinalGradesService {
  constructor(
    @InjectRepository(FinalGrade)
    private readonly finalGradeRepository: Repository<FinalGrade>,

    private readonly courseGroupStudentService: CoursesGroupsStudentsService
  ) {}

  async create(createFinalGradeDto: CreateFinalGradeDto, user: User) {
    const { courseGroupStudentId, ...data } = createFinalGradeDto;
    const courseGroupStudent = await this.courseGroupStudentService.findOne(courseGroupStudentId, user);

    try {
      const finalGrade = this.finalGradeRepository.create({
        courseGroupStudent,
        ...data
      });
      await this.finalGradeRepository.save(finalGrade);

      return finalGrade;

    } catch (error) {
      handleDBErrors(error, 'create - finalGrades');
    }
  }

  async findAll(courseGroupStudentId: number) {
    try {
      return await this.finalGradeRepository.find({
        where: { courseGroupStudent: { id: courseGroupStudentId }, isDeleted: false },
      });
    } catch (error) {
      handleDBErrors(error, 'findAll - finalGrades');
    }
  }

  async findOne(id: number) {
    const finalGrade = await this.finalGradeRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${ id } not found`);

    return finalGrade;
  }

  async update(id: number, updateFinalGradeDto: UpdateFinalGradeDto) {
    const { courseGroupStudentId, ...data } = updateFinalGradeDto;
    const finalGrade = await this.finalGradeRepository.preload({
      id,
      ...data
    });
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${ id } not found`);

    try {
      await this.finalGradeRepository.save(finalGrade);

      return finalGrade;

    } catch (error) {
      handleDBErrors(error, 'update - finalGrade');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.finalGradeRepository.update(id, { isDeleted: true });
      
    } catch (error) {
      handleDBErrors(error, 'remove - finalGrade');
    }
  }
}
