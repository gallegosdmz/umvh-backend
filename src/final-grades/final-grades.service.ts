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

@Injectable()
export class FinalGradesService {
  constructor(
    @InjectRepository(FinalGrade)
    private readonly finalGradeRepository: Repository<FinalGrade>,

    @InjectRepository(CourseGroupStudent)
    private readonly courseGroupStudentRepository: Repository<CourseGroupStudent>,

    private readonly courseGroupStudentService: CoursesGroupsStudentsService
  ) {}

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
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${ id } not found`);

    return finalGrade;
  }

  async update(id: number, updateFinalGradeDto: UpdateFinalGradeDto) {
    const { courseGroupStudentId, ...data } = updateFinalGradeDto;
    const finalGrade = await this.finalGradeRepository.preload({
      id,
      ...data
    });
    if (!finalGrade) throw new NotFoundException(`Final Grade with id: ${ id } not found`);

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
      // Primero obtener todos los grupos activos del período
      const groups = await this.courseGroupStudentRepository
        .createQueryBuilder('cgs')
        .leftJoinAndSelect('cgs.courseGroup', 'cg')
        .leftJoinAndSelect('cg.group', 'g')
        .where('g.period.id = :periodId', { periodId })
        .andWhere('g.isDeleted = false')
        .andWhere('cgs.isDeleted = false')
        .andWhere('cg.isDeleted = false')
        .select([
          'g.id as groupId',
          'g.name as groupName',
          'g.semester as semester'
        ])
        .groupBy('g.id, g.name, g.semester')
        .orderBy('g.semester', 'ASC')
        .addOrderBy('g.name', 'ASC')
        .getRawMany();
  
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
          'COUNT(DISTINCT cgs.id) as totalStudents'
        ])
        .groupBy('g.semester')
        .getRawMany();
  
      // Preparar la respuesta con estructura agrupada
      const response: any = {
        periodId,
        generalAverages
      };
  
      // Para cada grupo, generar sus reportes específicos
      for (const group of groups) {
        const groupKey = `group${group.groupName.replace(/\s+/g, '')}`; // Eliminar espacios del nombre
        
        // PROMEDIOS POR GRUPO (solo para este grupo específico)
        const groupAverages = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupId })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'g.name as groupName',
            'g.semester as semester',
            'AVG(pg.grade) as averageGrade',
            'COUNT(DISTINCT cgs.id) as totalStudents'
          ])
          .groupBy('g.id, g.name, g.semester')
          .getRawMany();
  
        // PROMEDIOS POR GRUPO POR ASIGNATURA (solo para este grupo específico)
        const groupSubjectAverages = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupId })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'g.name as groupName',
            'g.semester as semester',
            'c.name as courseName',
            'AVG(pg.grade) as averageGrade',
            'COUNT(DISTINCT cgs.id) as totalStudents'
          ])
          .groupBy('g.id, g.name, g.semester, c.id, c.name')
          .orderBy('c.name', 'ASC')
          .getRawMany();
  
        // CANTIDADES DE ALUMNOS REPROBADOS POR ASIGNATURA (solo para este grupo específico)
        const failedStudentsBySubject = await this.courseGroupStudentRepository
          .createQueryBuilder('cgs')
          .leftJoinAndSelect('cgs.courseGroup', 'cg')
          .leftJoinAndSelect('cg.course', 'c')
          .leftJoinAndSelect('cg.group', 'g')
          .leftJoinAndSelect('cgs.student', 's')
          .leftJoinAndSelect('cgs.partialGrades', 'pg')
          .where('g.period.id = :periodId', { periodId })
          .andWhere('g.id = :groupId', { groupId: group.groupId })
          .andWhere('cgs.isDeleted = false')
          .andWhere('cg.isDeleted = false')
          .andWhere('s.isDeleted = false')
          .select([
            'c.name as courseName',
            'g.semester as semester',
            'COUNT(DISTINCT CASE WHEN pg.grade < 5 THEN cgs.id END) as failedStudents',
            'COUNT(DISTINCT cgs.id) as totalStudents'
          ])
          .groupBy('c.id, c.name, g.semester')
          .orderBy('c.name', 'ASC')
          .getRawMany();
  
        // Agregar los datos del grupo a la respuesta
        response[groupKey] = {
          groupInfo: {
            id: group.groupId,
            name: group.groupName,
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
