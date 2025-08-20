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
      .leftJoinAndSelect('cgs.partialGrades', 'pg')
      .leftJoinAndSelect('cgs.coursesGroupsAttendances', 'cga')
      .leftJoinAndSelect('cgs.partialEvaluationGrades', 'peg')
      .leftJoinAndSelect('peg.partialEvaluation', 'pev')
      .where('cg.id = :courseGroupId', { courseGroupId })
      .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
      .andWhere('pe.isDeleted = :peIsDeleted', { peIsDeleted: false })
      .andWhere('cggs.isDeleted = :cggsIsDeleted', { cggsIsDeleted: false })
      .andWhere('pg.isDeleted = :pgIsDeleted', { pgIsDeleted: false })
      .andWhere('pev.isDeleted = :pevIsDeleted', { pevIsDeleted: false })
      .getOne();

    if (!courseGroup) {
      throw new NotFoundException(`Course Group with id: ${courseGroupId} not found`);
    }

    if (!courseGroup.group) {
      throw new NotFoundException(`Group not found for Course Group with id: ${courseGroupId}`);
    }

    // ✅ DEBUG: Verificar consultas
    console.log('🔍 DEBUG - Consultas ejecutadas:');
    console.log('📊 CourseGroup ID:', courseGroupId);
    console.log('📊 CourseGroup encontrado:', !!courseGroup);
    console.log('📊 Students en courseGroup:', courseGroup?.coursesGroupsStudents?.length || 0);
    console.log('📊 Partial Evaluations:', courseGroup?.partialEvaluations?.length || 0);

    // ✅ Estudiantes con datos mínimos necesarios
    const students = courseGroup.coursesGroupsStudents
      .filter(cgs => !cgs.isDeleted)
      .map(cgs => ({
        id: cgs.student.id,
        fullName: cgs.student.fullName,
        registrationNumber: cgs.student.registrationNumber,
        courseGroupStudentId: cgs.id,
        semester: courseGroup.group.semester || 1,
      }));

    // ✅ Calificaciones parciales por estudiante
    const partialGrades = courseGroup.coursesGroupsStudents
      .filter(cgs => !cgs.isDeleted)
      .flatMap(cgs =>
        cgs.partialGrades
          .filter(pg => !pg.isDeleted)
          .map(pg => ({
            id: pg.id,
            courseGroupStudentId: cgs.id,
            partial: pg.partial,
            grade: pg.grade,
            date: pg.date ? new Date(pg.date).toISOString().split('T')[0] : null,
          }))
      );

    // ✅ Asistencias agrupadas por estudiante y parcial
    const attendances = courseGroup.coursesGroupsStudents
      .filter(cgs => !cgs.isDeleted)
      .flatMap(cgs =>
        cgs.coursesGroupsAttendances.map(att => ({
          id: att.id,
          courseGroupStudentId: cgs.id,
          partial: att.partial,
          attend: att.attend,
          date: new Date(att.date).toISOString().split('T')[0],
        }))
      );

    // ✅ Evaluaciones definidas (sin duplicar datos)
    const partialEvaluations = courseGroup.partialEvaluations
      .filter(pe => !pe.isDeleted)
      .map(pe => ({
        id: pe.id,
        name: pe.name,
        type: pe.type,
        slot: pe.slot,
        partial: pe.partial,
        courseGroupId: courseGroup.id,
      }));

    // ✅ Esquema de ponderaciones
    const gradingSchemes = courseGroup.coursesGroupsGradingschemes
      .filter(gs => !gs.isDeleted)
      .map(gs => ({
        id: gs.id,
        type: gs.type,
        percentage: gs.percentage,
      }));

    // ✅ Calificaciones de evaluaciones (DATOS PLANOS)
    const partialEvaluationGrades = courseGroup.coursesGroupsStudents
      .filter(cgs => !cgs.isDeleted)
      .flatMap(cgs =>
        cgs.partialEvaluationGrades.map(peg => ({
          id: peg.id,
          courseGroupStudentId: cgs.id,
          partialEvaluationId: peg.partialEvaluation.id,
          grade: peg.grade,
          evaluationName: peg.partialEvaluation.name,
          evaluationType: peg.partialEvaluation.type,
          evaluationSlot: peg.partialEvaluation.slot,
          evaluationPartial: peg.partialEvaluation.partial,
        }))
      );

    // ✅ DEBUG: Verificar datos antes de agrupar
    console.log('🔍 DEBUG - Datos antes de agrupar:');
    console.log('📊 Partial Evaluation Grades encontrados:', partialEvaluationGrades.length);
    if (partialEvaluationGrades.length > 0) {
      console.log('📊 Sample Grade:', partialEvaluationGrades[0]);
    }
    console.log('📊 Attendances encontradas:', attendances.length);
    if (attendances.length > 0) {
      console.log('📊 Sample Attendance:', attendances[0]);
    }

    // ✅ NUEVO: Calificaciones agrupadas por estudiante (SUPER OPTIMIZADO)
    const studentGrades = {};
    
    // Inicializar estructura para cada estudiante y parcial
    students.forEach(student => {
      studentGrades[student.courseGroupStudentId] = {};
      
      // Obtener el máximo parcial de las evaluaciones
      const maxPartial = Math.max(...courseGroup.partialEvaluations
        .filter(pe => !pe.isDeleted)
        .map(pe => pe.partial), 0);
      
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
      const studentId = grade.courseGroupStudentId;
      const partial = grade.evaluationPartial;
      
      console.log(`🔍 Procesando grade: studentId=${studentId}, partial=${partial}, type=${grade.evaluationType}`);
      
      if (!studentGrades[studentId]) {
        console.log(`⚠️ Creando estructura para studentId=${studentId}`);
        studentGrades[studentId] = {};
      }
      if (!studentGrades[studentId][partial]) {
        console.log(`⚠️ Creando estructura para studentId=${studentId}, partial=${partial}`);
        studentGrades[studentId][partial] = {
          actividades: [],
          evidencias: [],
          producto: null,
          examen: null
        };
      }
      
      // Asignar según el tipo
      if (grade.evaluationType === 'Actividades') {
        // Asegurar que el array tenga el tamaño correcto
        while (studentGrades[studentId][partial].actividades.length <= grade.evaluationSlot) {
          studentGrades[studentId][partial].actividades.push(null);
        }
        studentGrades[studentId][partial].actividades[grade.evaluationSlot] = {
          slot: grade.evaluationSlot,
          grade: grade.grade,
          id: grade.id
        };
        console.log(`✅ Asignada actividad: slot=${grade.evaluationSlot}, grade=${grade.grade}`);
      } else if (grade.evaluationType === 'Evidencias') {
        // Asegurar que el array tenga el tamaño correcto
        while (studentGrades[studentId][partial].evidencias.length <= grade.evaluationSlot) {
          studentGrades[studentId][partial].evidencias.push(null);
        }
        studentGrades[studentId][partial].evidencias[grade.evaluationSlot] = {
          slot: grade.evaluationSlot,
          grade: grade.grade,
          id: grade.id
        };
        console.log(`✅ Asignada evidencia: slot=${grade.evaluationSlot}, grade=${grade.grade}`);
      } else if (grade.evaluationType === 'Producto') {
        studentGrades[studentId][partial].producto = {
          grade: grade.grade,
          id: grade.id
        };
        console.log(`✅ Asignado producto: grade=${grade.grade}`);
      } else if (grade.evaluationType === 'Examen') {
        studentGrades[studentId][partial].examen = {
          grade: grade.grade,
          id: grade.id
        };
        console.log(`✅ Asignado examen: grade=${grade.grade}`);
      }
    });

    // ✅ NUEVO: Asistencias agrupadas por estudiante (SUPER OPTIMIZADO)
    const studentAttendances = {};
    
    // Inicializar estructura para cada estudiante
    students.forEach(student => {
      studentAttendances[student.courseGroupStudentId] = {};
    });
    
    // Agrupar asistencias por estudiante y parcial
    attendances.forEach(att => {
      const studentId = att.courseGroupStudentId;
      const partial = att.partial;
      
      console.log(`🔍 Procesando attendance: studentId=${studentId}, partial=${partial}`);
      
      if (!studentAttendances[studentId]) {
        console.log(`⚠️ Creando estructura para studentId=${studentId}`);
        studentAttendances[studentId] = {};
      }
      if (!studentAttendances[studentId][partial]) {
        console.log(`⚠️ Creando estructura para studentId=${studentId}, partial=${partial}`);
        studentAttendances[studentId][partial] = [];
      }
      
      studentAttendances[studentId][partial].push({
        date: new Date(att.date).toISOString().split('T')[0],
        attend: att.attend,
        id: att.id
      });
      console.log(`✅ Asistencia agregada: date=${att.date}, attend=${att.attend}`);
    });

    // ✅ DEBUG: Verificar que los datos se estén procesando correctamente
    console.log('🔍 DEBUG - Datos procesados:');
    console.log('📊 Students:', students.length);
    console.log('📊 Partial Grades:', partialGrades.length);
    console.log('📊 Attendances:', attendances.length);
    console.log('📊 Partial Evaluation Grades:', partialEvaluationGrades.length);
    console.log('📊 Student Grades Keys:', Object.keys(studentGrades));
    console.log('📊 Student Attendances Keys:', Object.keys(studentAttendances));
    
    // Verificar algunos datos específicos
    if (partialEvaluationGrades.length > 0) {
      console.log('📊 Sample Grade:', partialEvaluationGrades[0]);
    }
    if (attendances.length > 0) {
      console.log('📊 Sample Attendance:', attendances[0]);
    }

    // Retornar estructura optimizada
    return {
      students,
      partialGrades,
      attendances,
      partialEvaluations,
      gradingSchemes,
      partialEvaluationGrades,
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