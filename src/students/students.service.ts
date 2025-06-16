import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { BaseValidator } from 'src/core/validators/base.validator';
import { PaginationDto } from 'src/core/dtos/pagination.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly baseValidator: BaseValidator,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const {registrationNumber, ...data} = createStudentDto;
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

  async findAll(paginationDto: PaginationDto, user: User) {
    const { limit = 10, offset = 0 } = paginationDto;

    if (user.role === 'administrador') {
      return await this.studentRepository.find({
        where: { isDeleted: false },
        take: limit,
        skip: offset,
      });
    }

    // HACER QUERY BUILDER PARA SACAR LOS STUDENTS DEL MAESTRO QUE ESTÁ HACIENDO LA PETICIÓN

  }

  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!student) throw new NotFoundException(`Student with id: ${ id } not found`);

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) throw new NotFoundException(`Student with id: ${ id } not found`);

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
