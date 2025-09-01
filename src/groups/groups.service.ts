import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { PeriodsService } from 'src/periods/periods.service';
import { PaginationDto } from 'src/core/dtos/pagination.dto';

export interface IQuery {
  semester: number;
  groupName: string;
  period: string;
  students: {
    registrationNumber: string;
    fullName: string;
    courses: {
      name: string;
      gradeOrd: number;
      gradeExt: number;
    }[]
  }[]
}

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

  async findAllForDirector(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [groups, total] = await this.groupRepository.findAndCount({
      where: { isDeleted: false },
      take: limit,
      skip: offset,
      relations: {
        coursesGroups: { course: true, user: true, coursesGroupsStudents: { coursesGroupsAttendances: true, finalGrades: true, partialEvaluationGrades: true, partialGrades: true, student: true }, partialEvaluations: true }
      }
    });

    return {
      groups,
      total
    }
  }

  async findBoletas(groupId: number) {
    const query = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.period', 'period')
      .leftJoinAndSelect('group.coursesGroups', 'courseGroup')
      .leftJoinAndSelect('courseGroup.course', 'course')
      .leftJoinAndSelect('courseGroup.coursesGroupsStudents', 'courseGroupStudent')
      .leftJoinAndSelect('courseGroupStudent.student', 'student')
      .leftJoinAndSelect('courseGroupStudent.partialGrades', 'partialGrade')
      .leftJoinAndSelect('courseGroupStudent.finalGrades', 'finalGrade')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('courseGroup.isDeleted = :courseGroupIsDeleted', { courseGroupIsDeleted: false })
      .andWhere('courseGroupStudent.isDeleted = :courseGroupStudentIsDeleted', { courseGroupStudentIsDeleted: false })
      .andWhere('student.isDeleted = :studentIsDeleted', { studentIsDeleted: false })
      .andWhere('course.isDeleted = :courseIsDeleted', { courseIsDeleted: false })
      .select([
        'group.semester',
        'group.name',
        'period.name',
        'student.registrationNumber',
        'student.fullName',
        'course.name',
        'partialGrade.partial',
        'partialGrade.grade',
        'finalGrade.gradeOrdinary',
        'finalGrade.gradeExtraordinary'
      ])
      .orderBy('student.fullName', 'ASC')
      .addOrderBy('course.name', 'ASC')
      .addOrderBy('partialGrade.partial', 'ASC');

    const rawResults = await query.getRawMany();

    // Agrupar por estudiante y curso
    const studentsMap = new Map<string, any>();
    
    rawResults.forEach(row => {
      const registrationNumber = row.student_registrationNumber;
      const fullName = row.student_fullName;
      const groupName = row.group_name;
      const semester = row.group_semester;
      const periodName = row.period_name;
      const courseName = row.course_name;
      const partial = row.partialGrade_partial;
      const grade = row.partialGrade_grade;
      const gradeOrdinary = row.finalGrade_gradeOrdinary;
      const gradeExtraordinary = row.finalGrade_gradeExtraordinary;

      if (!studentsMap.has(registrationNumber)) {
        studentsMap.set(registrationNumber, {
          fullName,
          registrationNumber,
          groupName,
          semester,
          periodName,
          courses: new Map()
        });
      }

      const student = studentsMap.get(registrationNumber);
      
      if (!student.courses.has(courseName)) {
        student.courses.set(courseName, {
          name: courseName,
          grades: [],
          finalGrades: {
            gradeOrdinary: 0,
            gradeExtraordinary: 0
          }
        });
      }

      const course = student.courses.get(courseName);
      
      // Agregar calificación parcial si existe
      if (partial && grade !== null) {
        course.grades.push({
          grade,
          partial
        });
      }
      
      // Actualizar calificaciones finales si existen
      if (gradeOrdinary !== null) {
        course.finalGrades.gradeOrdinary = gradeOrdinary;
      }
      if (gradeExtraordinary !== null) {
        course.finalGrades.gradeExtraordinary = gradeExtraordinary;
      }
    });

    // Convertir el Map de cursos a array
    const result = Array.from(studentsMap.values()).map(student => ({
      ...student,
      courses: Array.from(student.courses.values())
    }));

    return result;
  }

  async findBoletasFinales(groupId: number) {
    const query = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.period', 'period')
      .leftJoinAndSelect('group.coursesGroups', 'courseGroup')
      .leftJoinAndSelect('courseGroup.course', 'course')
      .leftJoinAndSelect('courseGroup.coursesGroupsStudents', 'courseGroupStudent')
      .leftJoinAndSelect('courseGroupStudent.student', 'student')
      .leftJoinAndSelect('courseGroupStudent.finalGrades', 'finalGrade')
      .where('group.id = :groupId', { groupId })
      .andWhere('group.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('courseGroup.isDeleted = :courseGroupIsDeleted', { courseGroupIsDeleted: false })
      .andWhere('courseGroupStudent.isDeleted = :courseGroupStudentIsDeleted', { courseGroupStudentIsDeleted: false })
      .andWhere('student.isDeleted = :studentIsDeleted', { studentIsDeleted: false })
      .andWhere('course.isDeleted = :courseIsDeleted', { courseIsDeleted: false })
      .select([
        'group.semester',
        'group.name',
        'period.name',
        'student.registrationNumber',
        'student.fullName',
        'course.name',
        'finalGrade.gradeOrdinary',
        'finalGrade.gradeExtraordinary'
      ])
      .orderBy('student.fullName', 'ASC')
      .addOrderBy('course.name', 'ASC');

    const rawResults = await query.getRawMany();

    // Transformar los resultados raw a la estructura deseada
    const result: IQuery = {
      semester: rawResults[0]?.group_semester || 0,
      groupName: rawResults[0]?.group_name || '',
      period: rawResults[0]?.period_name || '',
      students: []
    };

    // Agrupar por estudiante
    const studentsMap = new Map<string, any>();
    
    rawResults.forEach(row => {
      const registrationNumber = row.student_registrationNumber;
      const fullName = row.student_fullName;
      const courseName = row.course_name;
      const gradeOrd = row.finalGrade_gradeOrdinary;
      const gradeExt = row.finalGrade_gradeExtraordinary;

      if (!studentsMap.has(registrationNumber)) {
        studentsMap.set(registrationNumber, {
          registrationNumber,
          fullName,
          courses: []
        });
      }

      const student = studentsMap.get(registrationNumber);
      
      // Solo agregar el curso si tiene calificaciones
      if (courseName) {
        student.courses.push({
          name: courseName,
          gradeOrd: gradeOrd || 0,
          gradeExt: gradeExt || 0
        });
      }
    });

    result.students = Array.from(studentsMap.values());

    return result;
  }

  async countTotal() {
    return await this.groupRepository.count({ where: { isDeleted: false } });
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
