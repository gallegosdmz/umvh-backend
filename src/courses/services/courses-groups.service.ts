import { Injectable, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroup } from "../entities/course-group.entity";
import { Repository } from "typeorm";
import { CreateCourseGroupDto } from "../dto/create-course-group.dto";
import { handleDBErrors } from "src/utils/errors";
import { CoursesService } from "./courses.service";
import { GroupsService } from "src/groups/groups.service";
import { UsersService } from "src/users/services/users.service";
import { UpdateCourseGroupDto } from "../dto/update-course-group.dto";
import { PaginationDto } from "src/core/dtos/pagination.dto";
import { CourseValidator } from "../validators/course.validator";
import { OptimizedEvaluationsDataResponse } from "../interfaces/evaluations-data.interface";

@Injectable()
export class CoursesGroupsService {
  constructor(
    @InjectRepository(CourseGroup)
    private readonly courseGroupRepository: Repository<CourseGroup>,

    @Inject(forwardRef(() => CoursesService))
    private readonly courseService: CoursesService,

    private readonly groupService: GroupsService,
    private readonly userService: UsersService,
    private readonly courseValidator: CourseValidator,
  ) {}

  async create(createCourseGroupDto: CreateCourseGroupDto) {
    const { courseId, groupId, userId, schedule } = createCourseGroupDto;

    const newSchedule = 'Por Defecto'

    const course = await this.courseService.findOne(courseId);
    const group = await this.groupService.findOne(groupId);
    const user = await this.userService.findOne(userId);

    // Validación para saber si ya hay un registro con el mismo courseId, groupId, userId y Schedule (horario)
    await this.courseValidator.checkDuplicateUserAssignment(
      course,
      group,
      user,
    );

    try {
      const courseGroup = this.courseGroupRepository.create({
        course,
        group,
        user,
        schedule: newSchedule
      });
      await this.courseGroupRepository.save(courseGroup);

      return courseGroup;

    } catch (error) {
      handleDBErrors(error, 'create - course-group');
    }
  }

  async findAllByCourse(courseId: number, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const course = await this.courseService.findOne(courseId);

    try {
      return await this.courseGroupRepository.find({
        where: { course, isDeleted: false },
        take: limit,
        skip: offset,
        relations: {
          course: true,
          group: { period: true },
          user: true,
          coursesGroupsGradingschemes: true,
        },
      });

    } catch (error) {
      handleDBErrors(error, 'findAll - courses-groups');
    }
  }

  async findOne(id: number) {
    const courseGroup = await this.courseGroupRepository.findOne({
      where: { id, isDeleted: false },
      relations: { course: true, group: { period: true }, user: true, coursesGroupsStudents: { student: true }, coursesGroupsGradingschemes: true },
    });
    if (!courseGroup) throw new NotFoundException(`Course Group with id: ${ id } not found`);

    return courseGroup;
  }

  async update(id: number, updateCourseGroupDto: UpdateCourseGroupDto) {
    const courseGroup = await this.findOne(id);

    const { courseId, groupId, userId } = updateCourseGroupDto;
    
    // Solo actualizar si los IDs son diferentes
    if (courseId && courseId !== courseGroup.course.id) {
      courseGroup.course = await this.courseService.findOne(courseId);
    }
    if (groupId && groupId !== courseGroup.group.id) {
      courseGroup.group = await this.groupService.findOne(groupId);
    }
    if (userId && userId !== courseGroup.user.id) {
      courseGroup.user = await this.userService.findOne(userId);
    }

    try {
      await this.courseGroupRepository.save(courseGroup);
      return courseGroup;
    } catch (error) {
      handleDBErrors(error, 'update - course-group');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    
    try {
      await this.courseGroupRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - course-group');
    }
  }

  async removeByCourseId(courseId: number) {
    try {
      await this.courseGroupRepository.update(
        { course: { id: courseId }, isDeleted: false },
        { isDeleted: true }
      );
    } catch (error) {
      handleDBErrors(error, 'removeByCourseId - course-group');
    }
  }

  async getEvaluationsData(courseGroupId: number): Promise<OptimizedEvaluationsDataResponse> {
    // ✅ CONSULTA PRINCIPAL OPTIMIZADA - Usar QueryBuilder para mejor rendimiento
    const courseGroup = await this.courseGroupRepository
      .createQueryBuilder('cg')
      .leftJoinAndSelect('cg.group', 'g')
      .leftJoinAndSelect('cg.coursesGroupsStudents', 'cgs')
      .leftJoinAndSelect('cgs.student', 's')
      .leftJoinAndSelect('cg.partialEvaluations', 'pe')
      .leftJoinAndSelect('cg.coursesGroupsGradingschemes', 'cggs')
      .where('cg.id = :courseGroupId', { courseGroupId })
      .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
      .andWhere('pe.isDeleted = :peIsDeleted', { peIsDeleted: false })
      .andWhere('cggs.isDeleted = :cggsIsDeleted', { cggsIsDeleted: false })
      .getOne();

    if (!courseGroup) {
      throw new NotFoundException(`Course Group with id: ${courseGroupId} not found`);
    }

    if (!courseGroup.group) {
      throw new NotFoundException(`Group not found for Course Group with id: ${courseGroupId}`);
    }

    // ✅ CONSULTA DE CALIFICACIONES PARCIALES - Optimizada
    const partialGrades = await this.courseGroupRepository.manager
      .createQueryBuilder()
      .select([
        'pg.id as id',
        'cgs.id as courseGroupStudentId',
        'pg.partial as partial',
        'pg.grade as grade',
        'pg.date as date'
      ])
      .from('partial_grades', 'pg')
      .innerJoin('course_group_students', 'cgs', 'pg.courseGroupStudentId = cgs.id')
      .where('cgs.courseGroupId = :courseGroupId', { courseGroupId })
      .andWhere('cgs.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('pg.isDeleted = :pgIsDeleted', { pgIsDeleted: false })
      .getRawMany();

    // ✅ CONSULTA DE ASISTENCIAS - Optimizada
    const attendances = await this.courseGroupRepository.manager
      .createQueryBuilder()
      .select([
        'cga.id as id',
        'cgs.id as courseGroupStudentId',
        'cga.partial as partial',
        'cga.attend as attend',
        'cga.date as date'
      ])
      .from('course_group_attendances', 'cga')
      .innerJoin('course_group_students', 'cgs', 'cga.courseGroupStudentId = cgs.id')
      .where('cgs.courseGroupId = :courseGroupId', { courseGroupId })
      .andWhere('cgs.isDeleted = :isDeleted', { isDeleted: false })
      .getRawMany();

    // ✅ CONSULTA DE CALIFICACIONES DE EVALUACIONES - SUPER OPTIMIZADA
    const partialEvaluationGrades = await this.courseGroupRepository.manager
      .createQueryBuilder()
      .select([
        'peg.id as id',
        'cgs.id as courseGroupStudentId',
        'peg.partialEvaluationId as partialEvaluationId',
        'peg.grade as grade',
        'pe.name as evaluationName',
        'pe.type as evaluationType',
        'pe.slot as evaluationSlot',
        'pe.partial as evaluationPartial'
      ])
      .from('partial_evaluation_grades', 'peg')
      .innerJoin('course_group_students', 'cgs', 'peg.courseGroupStudentId = cgs.id')
      .innerJoin('partial_evaluations', 'pe', 'peg.partialEvaluationId = pe.id')
      .where('cgs.courseGroupId = :courseGroupId', { courseGroupId })
      .andWhere('cgs.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('pe.isDeleted = :peIsDeleted', { peIsDeleted: false })
      .getRawMany();

    // ✅ Estudiantes con datos mínimos necesarios
    const students = courseGroup.coursesGroupsStudents.map(cgs => ({
      id: cgs.student.id,
      fullName: cgs.student.fullName,
      registrationNumber: cgs.student.registrationNumber,
      courseGroupStudentId: cgs.id,
      semester: courseGroup.group.semester || 1,
    }));

    // ✅ Evaluaciones definidas (sin duplicar datos)
    const partialEvaluations = courseGroup.partialEvaluations.map(pe => ({
      id: pe.id,
      name: pe.name,
      type: pe.type,
      slot: pe.slot,
      partial: pe.partial,
      courseGroupId: courseGroup.id,
    }));

    // ✅ Esquema de ponderaciones
    const gradingSchemes = courseGroup.coursesGroupsGradingschemes.map(gs => ({
      id: gs.id,
      type: gs.type,
      percentage: gs.percentage,
    }));

    // ✅ NUEVO: Calificaciones agrupadas por estudiante (SUPER OPTIMIZADO)
    const studentGrades = {};
    students.forEach(student => {
      studentGrades[student.courseGroupStudentId] = {};
      
      // Inicializar estructura para cada parcial
      const maxPartial = Math.max(...courseGroup.partialEvaluations.map(pe => pe.partial), 0);
      
      for (let partial = 1; partial <= maxPartial; partial++) {
        studentGrades[student.courseGroupStudentId][partial] = {
          actividades: [],
          evidencias: [],
          producto: null,
          examen: null
        };
      }
    });

    // Agrupar calificaciones por estudiante y parcial
    partialEvaluationGrades.forEach(grade => {
      if (!studentGrades[grade.courseGroupStudentId]) {
        studentGrades[grade.courseGroupStudentId] = {};
      }
      if (!studentGrades[grade.courseGroupStudentId][grade.evaluationPartial]) {
        studentGrades[grade.courseGroupStudentId][grade.evaluationPartial] = {
          actividades: [],
          evidencias: [],
          producto: null,
          examen: null
        };
      }
      
      // Asignar según el tipo
      if (grade.evaluationType === 'Actividades') {
        // Asegurar que el array tenga el tamaño correcto
        while (studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].actividades.length <= grade.evaluationSlot) {
          studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].actividades.push(null);
        }
        studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].actividades[grade.evaluationSlot] = {
          slot: grade.evaluationSlot,
          grade: grade.grade,
          id: grade.id
        };
      } else if (grade.evaluationType === 'Evidencias') {
        // Asegurar que el array tenga el tamaño correcto
        while (studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].evidencias.length <= grade.evaluationSlot) {
          studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].evidencias.push(null);
        }
        studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].evidencias[grade.evaluationSlot] = {
          slot: grade.evaluationSlot,
          grade: grade.grade,
          id: grade.id
        };
      } else if (grade.evaluationType === 'Producto') {
        studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].producto = {
          grade: grade.grade,
          id: grade.id
        };
      } else if (grade.evaluationType === 'Examen') {
        studentGrades[grade.courseGroupStudentId][grade.evaluationPartial].examen = {
          grade: grade.grade,
          id: grade.id
        };
      }
    });

    // ✅ NUEVO: Asistencias agrupadas por estudiante (SUPER OPTIMIZADO)
    const studentAttendances = {};
    students.forEach(student => {
      studentAttendances[student.courseGroupStudentId] = {};
      
      // Agrupar asistencias por parcial
      attendances
        .filter(att => att.courseGroupStudentId === student.courseGroupStudentId)
        .forEach(att => {
          if (!studentAttendances[student.courseGroupStudentId][att.partial]) {
            studentAttendances[student.courseGroupStudentId][att.partial] = [];
          }
          studentAttendances[student.courseGroupStudentId][att.partial].push({
            date: new Date(att.date).toISOString().split('T')[0],
            attend: att.attend,
            id: att.id
          });
        });
    });

    // ✅ Formatear datos para la respuesta
    const formattedPartialGrades = partialGrades.map(pg => ({
      id: pg.id,
      courseGroupStudentId: pg.courseGroupStudentId,
      partial: pg.partial,
      grade: pg.grade,
      date: pg.date ? new Date(pg.date).toISOString().split('T')[0] : null,
    }));

    const formattedAttendances = attendances.map(att => ({
      id: att.id,
      courseGroupStudentId: att.courseGroupStudentId,
      partial: att.partial,
      attend: att.attend,
      date: new Date(att.date).toISOString().split('T')[0],
    }));

    const formattedPartialEvaluationGrades = partialEvaluationGrades.map(peg => ({
      id: peg.id,
      courseGroupStudentId: peg.courseGroupStudentId,
      partialEvaluationId: peg.partialEvaluationId,
      grade: peg.grade,
      evaluationName: peg.evaluationName,
      evaluationType: peg.evaluationType,
      evaluationSlot: peg.evaluationSlot,
      evaluationPartial: peg.evaluationPartial,
    }));

    // Retornar estructura optimizada
    return {
      students,
      partialGrades: formattedPartialGrades,
      attendances: formattedAttendances,
      partialEvaluations,
      gradingSchemes,
      partialEvaluationGrades: formattedPartialEvaluationGrades,
      studentGrades,        // ✅ NUEVO: Datos agrupados
      studentAttendances    // ✅ NUEVO: Asistencias agrupadas
    };
  }

  async getCompleteData(courseGroupId: number) {
    const courseGroup = await this.courseGroupRepository.findOne({
      where: { id: courseGroupId, isDeleted: false },
      relations: {
        coursesGroupsStudents: {
          student: true,
          coursesGroupsAttendances: true,
          partialGrades: true,
          finalGrades: true,
        },
        partialEvaluations: true,
      },
    });

    if (!courseGroup) {
      throw new NotFoundException(`Course Group with id: ${courseGroupId} not found`);
    }

    // Filtrar solo estudiantes no eliminados y ordenar por ID de menor a mayor
    const activeStudents = courseGroup.coursesGroupsStudents
      .filter(cgs => !cgs.isDeleted)
      .sort((a, b) => a.student.id - b.student.id);

    const students = activeStudents.map(cgs => ({
      id: cgs.student.id,
      student: {
        id: cgs.student.id,
        fullName: cgs.student.fullName,
        registrationNumber: cgs.student.registrationNumber,
      },
      courseGroupStudentId: cgs.id,
    }));

    const partialGrades = activeStudents.flatMap(cgs =>
      cgs.partialGrades
        .filter(pg => !pg.isDeleted)
        .map(pg => ({
          courseGroupStudentId: cgs.id,
          partial: pg.partial,
          grade: pg.grade,
        }))
    );

    const attendances = activeStudents.flatMap(cgs =>
      cgs.coursesGroupsAttendances.map(att => ({
        courseGroupStudentId: cgs.id,
        partial: att.partial,
        date: new Date(att.date).toISOString().split('T')[0], // Formato YYYY-MM-DD
        attend: att.attend,
      }))
    );

    const finalGrades = activeStudents.flatMap(cgs =>
      cgs.finalGrades
        .filter(fg => !fg.isDeleted)
        .map(fg => ({
          courseGroupStudentId: cgs.id,
          gradeOrdinary: fg.gradeOrdinary,
          gradeExtraordinary: fg.gradeExtraordinary,
        }))
    );

    const partialEvaluations = courseGroup.partialEvaluations
      .filter(pe => !pe.isDeleted)
      .map(pe => ({
        id: pe.id,
        courseGroupId: courseGroup.id,
        type: pe.type,
        name: pe.name,
        partial: pe.partial,
        slot: pe.slot,
      }));

    return {
      students,
      partialGrades,
      attendances,
      finalGrades,
      partialEvaluations,
    };
  }
}