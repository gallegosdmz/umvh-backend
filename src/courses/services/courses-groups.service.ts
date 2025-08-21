import { Injectable, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroup } from "../entities/course-group.entity";
import { DataSource, Repository } from "typeorm";
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
    private readonly dataSource: DataSource,
  ) { }

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
    if (!courseGroup) throw new NotFoundException(`Course Group with id: ${id} not found`);

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
    // Students
    const students = await this.dataSource
      .createQueryBuilder()
      .select([
        "s.id AS id",
        "s.fullName AS fullName",
        "s.registrationNumber AS registrationNumber",
        "cgs.id AS courseGroupStudentId",
      ])
      .from("course_group_students", "cgs")
      .innerJoin("students", "s", "s.id = cgs.studentId")
      .where("cgs.courseGroupId = :courseGroupId", { courseGroupId })
      .andWhere("cgs.isDeleted = false")
      .getRawMany();

    // Partial Grades
    const partialGrades = await this.dataSource
      .createQueryBuilder()
      .select([
        "pg.id AS id",
        "pg.courseGroupStudentId AS courseGroupStudentId",
        "pg.partial AS partial",
        "pg.grade AS grade",
      ])
      .from("partial_grades", "pg")
      .innerJoin("course_group_students", "cgs", "cgs.id = pg.courseGroupStudentId")
      .where("cgs.courseGroupId = :courseGroupId", { courseGroupId })
      .getRawMany();

    // Attendances
    const attendances = await this.dataSource
      .createQueryBuilder()
      .select([
        "a.id AS id",
        "a.courseGroupStudentId AS courseGroupStudentId",
        "a.partial AS partial",
        "a.attend AS attend",
        "TO_CHAR(a.date, 'YYYY-MM-DD') AS date",
      ])
      .from("course_group_attendances", "a")
      .innerJoin("course_group_students", "cgs", "cgs.id = a.courseGroupStudentId")
      .where("cgs.courseGroupId = :courseGroupId", { courseGroupId })
      .getRawMany();

    // Partial Evaluations
    const partialEvaluations = await this.dataSource
      .createQueryBuilder()
      .select([
        "pe.id AS id",
        "pe.name AS name",
        "pe.type AS type",
        "pe.slot AS slot",
        "pe.partial AS partial",
      ])
      .from("partial_evaluations", "pe")
      .where("pe.courseGroupId = :courseGroupId", { courseGroupId })
      .getRawMany();

    // Grading Schemes
    const gradingSchemes = await this.dataSource
      .createQueryBuilder()
      .select([
        "gs.id AS id",
        "gs.type AS type",
        "gs.percentage AS percentage",
      ])
      .from("course_group_gradingschemes", "gs")
      .where("gs.courseGroupId = :courseGroupId", { courseGroupId })
      .getRawMany();

    // Partial Evaluation Grades
    const partialEvaluationGrades = await this.dataSource
      .createQueryBuilder()
      .select([
        "peg.id AS id",
        "peg.courseGroupStudentId AS courseGroupStudentId",
        "peg.partialEvaluationId AS partialEvaluationId",
        "peg.grade AS grade",
      ])
      .from("partial_evaluation_grades", "peg")
      .innerJoin("course_group_students", "cgs", "cgs.id = peg.courseGroupStudentId")
      .where("cgs.courseGroupId = :courseGroupId", { courseGroupId })
      .getRawMany();

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