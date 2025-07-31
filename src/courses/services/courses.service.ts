import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { PaginationDto } from 'src/core/dtos/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import { CoursesGroupsService } from './courses-groups.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @Inject(forwardRef(() => CoursesGroupsService))
    private readonly courseGroupService: CoursesGroupsService,
  ) { }

  async create(createCourseDto: CreateCourseDto) {
    try {
      const course = this.courseRepository.create(createCourseDto);
      await this.courseRepository.save(course);

      return course;

    } catch (error) {
      handleDBErrors(error, 'create - courses');
    }
  }

  async findAll(paginationDto: PaginationDto, user: User) {
    const { limit = 10, offset = 0 } = paginationDto;

    // ARREGLAR PARA QUE SI EL USER ES ADMIN, LE MUESTRE TODOS LOS COURSES
    if (user.role === 'administrador') {
      return await this.courseRepository.find({
        where: { isDeleted: false },
        relations: {
          coursesGroups: { 
            group: { 
              period: true 
            }, 
            user: true,
            coursesGroupsGradingschemes: true,
            coursesGroupsStudents: {
              coursesGroupsAttendances: true,
              student: true,
            }
          },
        },
      });
    }
   
    const query = this.courseRepository.createQueryBuilder('course')
      .leftJoinAndSelect('course.coursesGroups', 'courseGroup')
      .leftJoinAndSelect('courseGroup.group', 'group')
      .leftJoinAndSelect('group.period', 'period')
      .leftJoinAndSelect('courseGroup.user', 'user')
      .leftJoinAndSelect('courseGroup.coursesGroupsGradingschemes', 'coursesGroupsGradingschemes')
      .leftJoinAndSelect('courseGroup.coursesGroupsStudents', 'coursesGroupsStudents')
      .leftJoinAndSelect('coursesGroupsStudents.coursesGroupsAttendances', 'coursesGroupsAttendances')
      .leftJoinAndSelect('coursesGroupsStudents.student', 'student')
      .where('course.isDeleted = false')
      .andWhere('courseGroup.userId = :userId', { userId: user.id })
      .skip(offset)
      .take(limit);

    return await query.getMany();
  }

  async findOne(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        coursesGroups: { group: true, user: true, coursesGroupsGradingschemes: true },
      },
    });
    if (!course) throw new NotFoundException(`Course with id: ${ id } not found`);

    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepository.preload({
      id,
      ...updateCourseDto,
    });
    if (!course) throw new NotFoundException(`Course with id: ${id} not found`);

    try {
      await this.courseRepository.save(course);
      return course;

    } catch (error) {
      handleDBErrors(error, 'update - courses');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    
    try {
      // Eliminar todos los courseGroups relacionados en una sola operación
      await this.courseGroupService.removeByCourseId(id);
      
      // Marcar el curso como eliminado
      await this.courseRepository.update(id, { isDeleted: true });


    } catch (error) {
      handleDBErrors(error, 'remove - courses');
    }
  }
}
