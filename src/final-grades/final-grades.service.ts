import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFinalGradeDto } from './dto/create-final-grade.dto';
import { UpdateFinalGradeDto } from './dto/update-final-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FinalGrade } from './entities/final-grade.entity';
import { Repository } from 'typeorm';
import { CoursesGroupsStudentsService } from 'src/courses/services/courses-groups-students.service';
import { handleDBErrors } from 'src/utils/errors';
import { User } from 'src/users/entities/user.entity';
import { CourseGroupStudent } from 'src/courses/entities/course-group-student.entity';
import { Group } from 'src/groups/entities/group.entity';

@Injectable()
export class FinalGradesService {
  constructor(
    @InjectRepository(FinalGrade)
    private readonly finalGradeRepository: Repository<FinalGrade>,

    @InjectRepository(CourseGroupStudent)
    private readonly courseGroupStudentRepository: Repository<CourseGroupStudent>,

    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,

    private readonly courseGroupStudentService: CoursesGroupsStudentsService
  ) { }

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
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${id} not found`);

    return finalGrade;
  }

  async update(id: number, updateFinalGradeDto: UpdateFinalGradeDto) {
    const { courseGroupStudentId, ...data } = updateFinalGradeDto;
    const finalGrade = await this.finalGradeRepository.preload({
      id,
      ...data
    });
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${id} not found`);

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

  async generateReports(periodId: number) {
    try {
      // 1. PROMEDIOS GENERALES (se mantiene igual)
      const generalAverages = await this.courseGroupStudentRepository
        .createQueryBuilder('cgs')
        .leftJoinAndSelect('cgs.courseGroup', 'cg')
        .leftJoinAndSelect('cg.course', 'c')
        .leftJoinAndSelect('cg.group', 'g')
        .leftJoinAndSelect('cgs.student', 's')
        .leftJoinAndSelect('cgs.partialGrades', 'pg')
        .where('g.period.id = :periodId', { periodId })
        .andWhere('cgs.isDeleted = false')
        .andWhere('cg.isDeleted = false')
        .andWhere('s.isDeleted = false')
        .select([
          'g.semester as semester',
          'AVG(pg.grade) as averageGrade',
          'COUNT(DISTINCT s.id) as totalStudents' // Cambiar cgs.id por s.id
        ])
        .groupBy('g.semester')
        .getRawMany();

      // NUEVA CONSULTA: PROMEDIOS GENERALES DE GRUPOS POR SEMESTRE
      const groupAveragesBySemester = await this.courseGroupStudentRepository
        .createQueryBuilder('cgs')
        .leftJoinAndSelect('cgs.courseGroup', 'cg')
        .leftJoinAndSelect('cg.course', 'c')
        .leftJoinAndSelect('cg.group', 'g')
        .leftJoinAndSelect('cgs.student', 's')
        .leftJoinAndSelect('cgs.partialGrades', 'pg')
        .where('g.period.id = :periodId', { periodId })
        .andWhere('cgs.isDeleted = false')
        .andWhere('cg.isDeleted = false')
        .andWhere('s.isDeleted = false')
        .select([
          'g.semester as semester',
          'g.name as groupName',
          'g.id as groupId',
          'AVG(pg.grade) as averageGrade',
          'COUNT(DISTINCT s.id) as totalStudents'
        ])
        .groupBy('g.semester, g.id, g.name')
        .orderBy('g.semester', 'ASC')
        .addOrderBy('g.name', 'ASC')
        .getRawMany();

      // Obtener grupos directamente desde la entidad Group
      const groups = await this.groupRepository
        .createQueryBuilder('g')
        .leftJoinAndSelect('g.period', 'p')
        .where('p.id = :periodId', { periodId })
        .andWhere('g.isDeleted = false')
        .select([
          'g.id as groupId',
          'g.name as groupName',
          'g.semester as semester'
        ])
        .orderBy('g.semester', 'ASC')
        .addOrderBy('g.name', 'ASC')
        .getRawMany();

      console.log('Raw groups result:', groups);
      console.log('First group:', groups[0]);

      // Preparar la respuesta con estructura agrupada
      const response: any = {
        periodId,
        generalAverages,
        groupAveragesBySemester
      };

      // Para cada grupo, generar sus reportes específicos
      for (const group of groups) {
        // CORRECCIÓN: Usar group.groupName (que viene del SELECT como alias)
        const groupName = group.groupname || `Grupo_${group.groupId}`;
        const groupKey = `group${groupName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '')}`;

        // PROMEDIOS POR GRUPO
        const groupAverages = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupid })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'g.name as groupName',
            'g.semester as semester',
            'AVG(pg.grade) as averageGrade',
            'COUNT(DISTINCT s.id) as totalStudents' // Cambiar cgs.id por s.id
          ])
          .groupBy('g.id, g.name, g.semester')
          .getRawMany();

        // PROMEDIOS POR GRUPO POR ASIGNATURA
        const groupSubjectAverages = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupid })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'g.name as groupName',
            'g.semester as semester',
            'c.name as courseName',
            'AVG(pg.grade) as averageGrade',
            'COUNT(DISTINCT s.id) as totalStudents' // Cambiar cgs.id por s.id
          ])
          .groupBy('g.id, g.name, g.semester, c.id, c.name')
          .orderBy('c.name', 'ASC')
          .getRawMany();

        // CANTIDADES DE ALUMNOS REPROBADOS POR ASIGNATURA
        const failedStudentsBySubject = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupid })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'c.name as courseName',
            'g.semester as semester',
            'COUNT(DISTINCT CASE WHEN pg.grade < 5 THEN s.id END) as failedStudents', // Cambiar cgs.id por s.id
            'COUNT(DISTINCT s.id) as totalStudents' // Cambiar cgs.id por s.id
          ])
          .groupBy('c.id, c.name, g.semester')
          .orderBy('c.name', 'ASC')
          .getRawMany();

        // Agregar los datos del grupo a la respuesta
        response[groupKey] = {
          groupInfo: {
            id: group.groupid, // Cambiar group.groupId por group.groupid
            name: groupName,
            semester: group.semester
          },
          groupAverages,
          groupSubjectAverages,
          failedStudentsBySubject
        };
      }

      return response;

    } catch (error) {
      handleDBErrors(error, 'generateReports - finalGrades');
    }
  }
}
