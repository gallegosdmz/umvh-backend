import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { BaseValidator } from 'src/core/validators/base.validator';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly baseValidator: BaseValidator,
  ) { }

  async create(createStudentDto: CreateStudentDto) {
    const { registrationNumber, ...data } = createStudentDto;
    await this.baseValidator.verifyFieldNotRepeated(Student, 'registrationNumber', registrationNumber);

    try {
      const student = this.studentRepository.create({
        registrationNumber,
        ...data,
      });
      await this.studentRepository.save(student);

      return student;

    } catch (error) {
      handleDBErrors(error, 'create - students');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      const [students, total] = await this.studentRepository.findAndCount({
        where: { isDeleted: false },
        take: limit,
        skip: offset,
      });

      return {
        students,
        total
      }

    } catch (error) {
      handleDBErrors(error, 'findAll - students');
    }
  }

  async findStudentsNotInCourseGroup(courseGroupId: number, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, search } = paginationDto;

    try {
      const queryBuilder = this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.coursesGroupsStudents', 'cgs')
        .where('student.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('(cgs.courseGroupId != :courseGroupId OR cgs.courseGroupId IS NULL)', { courseGroupId });

      if (search) {
        queryBuilder.andWhere(
          '(LOWER(student.fullName) LIKE LOWER(:search) OR ' +
          'LOWER(student.registrationNumber) LIKE LOWER(:search) OR ' +
          'CAST(student.semester AS TEXT) LIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Obtener el total de estudiantes que cumplen con los criterios (sin paginación)
      const total = await queryBuilder.getCount();

      // Obtener los estudiantes paginados
      const students = await queryBuilder
        .orderBy('student.id', 'ASC')
        .take(limit)
        .skip(offset)
        .getMany();

      return {
        students,
        total,
        limit,
        offset
      };

    } catch (error) {
      handleDBErrors(error, 'findAllWhere - students');
    }
  }

  async countTotal() {
    return await this.studentRepository.count({ where: { isDeleted: false } });
  }

  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!student) throw new NotFoundException(`Student with id: ${id} not found`);

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) throw new NotFoundException(`Student with id: ${id} not found`);

    try {
      await this.studentRepository.save(student);
      return student;

    } catch (error) {
      handleDBErrors(error, 'update - students');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.studentRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - students');
    }
  }
}
