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

  async getEvaluationsData(courseGroupId: number) {
    // Verificar que el courseGroup existe
    const courseGroupExists = await this.courseGroupRepository
      .createQueryBuilder('cg')
      .where('cg.id = :courseGroupId', { courseGroupId })
      .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
      .getExists();

    if (!courseGroupExists) {
      throw new NotFoundException(`Course Group with id: ${courseGroupId} not found`);
    }

    // Ejecutar todas las consultas en paralelo para máxima velocidad
    const [
      students,
      partialGrades,
      attendances,
      partialEvaluations,
      gradingSchemes,
      partialEvaluationGrades
    ] = await Promise.all([
      // Obtener estudiantes activos con sus datos básicos
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          's.id as id',
          's.fullName as fullName',
          's.registrationNumber as registrationNumber',
          'cgs.id as courseGroupStudentId'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.student', 's')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .getRawMany(),

      // Obtener calificaciones parciales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'pg.id as id',
          'cgs.id as courseGroupStudentId',
          'pg.partial as partial',
          'pg.grade as grade'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.partialGrades', 'pg')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .andWhere('pg.isDeleted = :pgIsDeleted', { pgIsDeleted: false })
        .getRawMany(),

      // Obtener asistencias
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'cga.id as id',
          'cgs.id as courseGroupStudentId',
          'cga.partial as partial',
          'cga.attend as attend',
          'DATE(cga.date) as date'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.coursesGroupsAttendances', 'cga')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .getRawMany(),

      // Obtener evaluaciones parciales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'pe.id as id',
          'pe.name as name',
          'pe.type as type',
          'pe.slot as slot',
          'pe.partial as partial'
        ])
        .innerJoin('cg.partialEvaluations', 'pe')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('pe.isDeleted = :peIsDeleted', { peIsDeleted: false })
        .getRawMany(),

      // Obtener esquemas de calificación
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'cgg.id as id',
          'cgg.type as type',
          'cgg.percentage as percentage'
        ])
        .innerJoin('cg.coursesGroupsGradingschemes', 'cgg')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgg.isDeleted = :cggIsDeleted', { cggIsDeleted: false })
        .getRawMany(),

      // Obtener calificaciones de evaluaciones parciales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'peg.id as id',
          'cgs.id as courseGroupStudentId',
          'pe.id as partialEvaluationId',
          'peg.grade as grade'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.partialEvaluationGrades', 'peg')
        .innerJoin('peg.partialEvaluation', 'pe')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .getRawMany()
    ]);

    return {
      students,
      partialGrades,
      attendances,
      partialEvaluations,
      gradingSchemes,
      partialEvaluationGrades,
    };
  }

  async getCompleteData(courseGroupId: number) {
    // Verificar que el courseGroup existe
    const courseGroupExists = await this.courseGroupRepository
      .createQueryBuilder('cg')
      .where('cg.id = :courseGroupId', { courseGroupId })
      .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
      .getExists();

    if (!courseGroupExists) {
      throw new NotFoundException(`Course Group with id: ${courseGroupId} not found`);
    }

    // Ejecutar todas las consultas en paralelo para máxima velocidad
    const [
      students,
      partialGrades,
      attendances,
      finalGrades,
      partialEvaluations
    ] = await Promise.all([
      // Obtener estudiantes activos ordenados por ID
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          's.id as id',
          's.fullName as fullName',
          's.registrationNumber as registrationNumber',
          'cgs.id as courseGroupStudentId'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.student', 's')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .orderBy('s.id', 'ASC')
        .getRawMany(),

      // Obtener calificaciones parciales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'cgs.id as courseGroupStudentId',
          'pg.partial as partial',
          'pg.grade as grade'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.partialGrades', 'pg')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .andWhere('pg.isDeleted = :pgIsDeleted', { pgIsDeleted: false })
        .getRawMany(),

      // Obtener asistencias
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'cgs.id as courseGroupStudentId',
          'cga.partial as partial',
          'DATE(cga.date) as date',
          'cga.attend as attend'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.coursesGroupsAttendances', 'cga')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .getRawMany(),

      // Obtener calificaciones finales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'cgs.id as courseGroupStudentId',
          'fg.gradeOrdinary as gradeOrdinary',
          'fg.gradeExtraordinary as gradeExtraordinary'
        ])
        .innerJoin('cg.coursesGroupsStudents', 'cgs')
        .innerJoin('cgs.finalGrades', 'fg')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('cgs.isDeleted = :cgsIsDeleted', { cgsIsDeleted: false })
        .andWhere('fg.isDeleted = :fgIsDeleted', { fgIsDeleted: false })
        .getRawMany(),

      // Obtener evaluaciones parciales
      this.courseGroupRepository
        .createQueryBuilder('cg')
        .select([
          'pe.id as id',
          'cg.id as courseGroupId',
          'pe.type as type',
          'pe.name as name',
          'pe.partial as partial',
          'pe.slot as slot'
        ])
        .innerJoin('cg.partialEvaluations', 'pe')
        .where('cg.id = :courseGroupId', { courseGroupId })
        .andWhere('cg.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('pe.isDeleted = :peIsDeleted', { peIsDeleted: false })
        .getRawMany()
    ]);

    return {
      students,
      partialGrades,
      attendances,
      finalGrades,
      partialEvaluations,
    };
  }
}