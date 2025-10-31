import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { handleDBErrors } from 'src/utils/errors';
import { PeriodsService } from 'src/periods/periods.service';
import { PaginationDto } from 'src/core/dtos/pagination.dto';
import { GroupStudentsDetailedResponseDto, GroupDetailedDto, StudentDto, CourseDto, PartialGradeDto, PartialEvaluationDto, PartialEvaluationGradeDto } from './dto/group-students-detailed.dto';

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
      .andWhere('(partialGrade.isDeleted = :partialGradeIsDeleted OR partialGrade.isDeleted IS NULL)', { partialGradeIsDeleted: false })
      .select([
        'group.semester',
        'group.name',
        'period.name',
        'student.registrationNumber',
        'student.fullName',
        'course.name',
        'partialGrade.id',
        'partialGrade.partial',
        'partialGrade.grade',
        'partialGrade.date',
        'finalGrade.gradeOrdinary',
        'finalGrade.gradeExtraordinary'
      ])
      .orderBy('student.fullName', 'ASC')
      .addOrderBy('course.name', 'ASC')
      .addOrderBy('partialGrade.partial', 'ASC')
      .addOrderBy('partialGrade.date', 'DESC');

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
      const date = row.partialGrade_date;
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
      
      // Agregar calificación parcial si existe (mantener solo la de fecha más reciente)
      if (partial && grade !== null && date !== null) {
        const existingGradeIndex = course.grades.findIndex(g => g.partial === partial);
        if (existingGradeIndex === -1) {
          // No existe, agregar nueva
          course.grades.push({
            grade,
            partial,
            date
          });
        } else {
          // Existe, comparar fechas y mantener la más reciente
          const existingDate = new Date(course.grades[existingGradeIndex].date);
          const newDate = new Date(date);
          if (newDate > existingDate) {
            // La nueva fecha es más reciente, reemplazar
            course.grades[existingGradeIndex].grade = grade;
            course.grades[existingGradeIndex].date = date;
          }
        }
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

  async findGroupsWithStudentsDetailed(paginationDto: PaginationDto): Promise<GroupStudentsDetailedResponseDto> {
    const { limit = 100, offset = 0 } = paginationDto;

    const query = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.period', 'period')
      .leftJoinAndSelect('group.coursesGroups', 'courseGroup')
      .leftJoinAndSelect('courseGroup.course', 'course')
      .leftJoinAndSelect('courseGroup.coursesGroupsStudents', 'courseGroupStudent')
      .leftJoinAndSelect('courseGroupStudent.student', 'student')
      .leftJoinAndSelect('courseGroupStudent.partialGrades', 'partialGrade')
      .leftJoinAndSelect('courseGroup.partialEvaluations', 'partialEvaluation')
      .leftJoinAndSelect('partialEvaluation.partialEvaluationGrades', 'partialEvaluationGrade')
      .leftJoinAndSelect('partialEvaluationGrade.courseGroupStudent', 'pegCourseGroupStudent')
      .where('group.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('courseGroup.isDeleted = :courseGroupIsDeleted', { courseGroupIsDeleted: false })
      .andWhere('courseGroupStudent.isDeleted = :courseGroupStudentIsDeleted', { courseGroupStudentIsDeleted: false })
      .andWhere('student.isDeleted = :studentIsDeleted', { studentIsDeleted: false })
      .andWhere('course.isDeleted = :courseIsDeleted', { courseIsDeleted: false })
      .andWhere('partialEvaluation.isDeleted = :partialEvaluationIsDeleted', { partialEvaluationIsDeleted: false })
      .andWhere('(pegCourseGroupStudent.id = courseGroupStudent.id OR pegCourseGroupStudent.id IS NULL)')
      .orderBy('group.semester', 'ASC')
      .addOrderBy('group.name', 'ASC')
      .addOrderBy('student.fullName', 'ASC')
      .addOrderBy('course.name', 'ASC')
      .addOrderBy('partialEvaluation.partial', 'ASC')
      .addOrderBy('partialEvaluation.slot', 'ASC');

    const rawResults = await query.getRawMany();

    // Obtener el total de grupos
    const totalQuery = this.groupRepository
      .createQueryBuilder('group')
      .where('group.isDeleted = :isDeleted', { isDeleted: false });
    
    const total = await totalQuery.getCount();

    // Transformar los resultados raw a la estructura deseada
    const groupsMap = new Map<number, GroupDetailedDto>();
    
    rawResults.forEach(row => {
      const groupId = row.group_id;
      const groupName = row.group_name;
      const semester = row.group_semester;
      const periodId = row.period_id;
      const periodName = row.period_name;
      
      const studentId = row.student_id;
      const studentFullName = row.student_fullName;
      const studentRegistrationNumber = row.student_registrationNumber;
      
      const courseId = row.course_id;
      const courseName = row.course_name;
      
      const partialGradeId = row.partialGrade_id;
      const partialGradePartial = row.partialGrade_partial;
      const partialGradeGrade = row.partialGrade_grade;
      const partialGradeDate = row.partialGrade_date;
      
      const partialEvaluationId = row.partialEvaluation_id;
      const partialEvaluationName = row.partialEvaluation_name;
      const partialEvaluationPartial = row.partialEvaluation_partial;
      const partialEvaluationType = row.partialEvaluation_type;
      const partialEvaluationSlot = row.partialEvaluation_slot;
      
      const partialEvaluationGradeId = row.partialEvaluationGrade_id;
      const partialEvaluationGradeGrade = row.partialEvaluationGrade_grade;

      // Crear o obtener el grupo
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: groupId,
          name: groupName,
          semester: semester,
          period: {
            id: periodId,
            name: periodName
          },
          students: []
        });
      }

      const group = groupsMap.get(groupId);
      if (!group) return; // Esto no debería pasar ya que acabamos de crear el grupo
      
      // Buscar o crear el estudiante
      let student = group.students.find(s => s.id === studentId);
      if (!student) {
        student = {
          id: studentId,
          fullName: studentFullName,
          registrationNumber: studentRegistrationNumber,
          courses: []
        };
        group.students.push(student);
      }

      // Buscar o crear el curso
      let course = student.courses.find(c => c.id === courseId);
      if (!course) {
        course = {
          id: courseId,
          name: courseName,
          semester: semester,
          partialGrades: [],
          partialEvaluations: []
        };
        student.courses.push(course);
      }

      // Agregar calificación parcial si existe (solo una por parcial)
      if (partialGradeId && partialGradeGrade !== null) {
        const existingPartialGrade = course.partialGrades.find(pg => pg.partial === partialGradePartial);
        if (!existingPartialGrade) {
          course.partialGrades.push({
            id: partialGradeId,
            partial: partialGradePartial,
            grade: partialGradeGrade,
            date: partialGradeDate
          });
        }
      }

      // Agregar evaluación parcial si existe
      if (partialEvaluationId) {
        let partialEvaluation = course.partialEvaluations.find(pe => pe.id === partialEvaluationId);
        if (!partialEvaluation) {
          partialEvaluation = {
            id: partialEvaluationId,
            name: partialEvaluationName,
            partial: partialEvaluationPartial,
            type: partialEvaluationType,
            slot: partialEvaluationSlot,
            grades: []
          };
          course.partialEvaluations.push(partialEvaluation);
        }

        // Agregar calificación de evaluación parcial si existe
        if (partialEvaluationGradeId && partialEvaluationGradeGrade !== null) {
          const existingGrade = partialEvaluation.grades.find(peg => peg.id === partialEvaluationGradeId);
          if (!existingGrade) {
            partialEvaluation.grades.push({
              id: partialEvaluationGradeId,
              grade: partialEvaluationGradeGrade
            });
          }
        }
      }
    });

    // Aplicar paginación
    const groupsArray = Array.from(groupsMap.values());
    const paginatedGroups = groupsArray.slice(offset, offset + limit);

    return {
      groups: paginatedGroups,
      total: total
    };
  }
}
