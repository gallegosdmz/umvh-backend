import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroupStudent } from "../entities/course-group-student.entity";
import { Repository } from "typeorm";
import { CreateCourseGroupStudentDto } from "../dto/create-course-group-student.dto";
import { CoursesGroupsService } from "./courses-groups.service";
import { StudentsService } from "src/students/students.service";
import { handleDBErrors } from "src/utils/errors";
import { CourseValidator } from "../validators/course.validator";
import { PaginationDto } from "src/core/dtos/pagination.dto";
import { User } from "src/users/entities/user.entity";
import { GroupsService } from "src/groups/groups.service";

@Injectable()
export class CoursesGroupsStudentsService {
    constructor(
        @InjectRepository(CourseGroupStudent)
        private readonly courseGroupStudentRepository: Repository<CourseGroupStudent>,

        private readonly courseGroupService: CoursesGroupsService,
        private readonly studentService: StudentsService,
        private readonly groupService: GroupsService,

        private readonly courseValidator: CourseValidator,
    ) {}

    async create(createCourseGroupStudentDto: CreateCourseGroupStudentDto) {
        const { courseGroupId, studentId } = createCourseGroupStudentDto;

        const courseGroup = await this.courseGroupService.findOne(courseGroupId);
        const student = await this.studentService.findOne(studentId);

        // Validación para saber si este alumno ya está asignado a este grupo y asignatura
        await this.courseValidator.checkDuplicateStudentAssignment(courseGroup, student);

        try {
            const courseGroupStudent = this.courseGroupStudentRepository.create({
                courseGroup,
                student
            });
            await this.courseGroupStudentRepository.save(courseGroupStudent);

            return courseGroupStudent;

        } catch (error) {
            handleDBErrors(error, 'create - course-group-student');
        }
    }

    async findAllByCourseGroup(courseGroupId: number, paginationDto: PaginationDto, user: User) {
        const { limit = 10, offset = 0 } = paginationDto;

        const courseGroup = await this.courseGroupService.findOne(courseGroupId);

        // Validación para saber si el maestro está asignado a este grupo y asingatura
        await this.courseValidator.checkUserAssignToCourse(courseGroup, user);

        try {
            return await this.courseGroupStudentRepository.find({
                where: { courseGroup, isDeleted: false },
                take: limit,
                skip: offset,
                relations: { courseGroup: { course: true, group: true, user: true }, student: true },
            });

        } catch (error) {
            handleDBErrors(error, 'findAllByCourseGroup - courses-groups-students');
        }
    }

    async findAllByGroup(groupId: number) {
        const group = await this.groupService.findOne(groupId);

        try {
            // Consulta para obtener estudiantes únicos del grupo
            const uniqueStudents = await this.courseGroupStudentRepository
                .createQueryBuilder('cgs')
                .leftJoinAndSelect('cgs.student', 'student')
                .leftJoin('cgs.courseGroup', 'courseGroup')
                .leftJoin('courseGroup.group', 'group')
                .where('group.id = :groupId', { groupId })
                .groupBy('student.id')
                .addGroupBy('student.fullName')
                .addGroupBy('student.registrationNumber')
                .addGroupBy('student.studentId')
                .addGroupBy('student.isDeleted')
                .getMany();

            return uniqueStudents;
            
        } catch (error) {
            handleDBErrors(error, 'findAllByGroup - courses-groups-students');
        }
    }

    async findOne(id: number, user: User) {
        const courseGroupStudent = await this.courseGroupStudentRepository.findOne({
            where: { id, isDeleted: false },
            relations: { courseGroup: { course: true, group: { period: true }, user: true }, student: true },
        });
        if (!courseGroupStudent) throw new NotFoundException(`Course Group Student with id: ${ id } not found`);

        // Validación para saber si el maestro está asignado a este grupo y asingatura
        await this.courseValidator.checkUserAssignToCourse(courseGroupStudent.courseGroup, user);

        return courseGroupStudent;
    }

    async remove(id: number, user: User) {
        await this.findOne(id, user);

        try {
            await this.courseGroupStudentRepository.update(id, { isDeleted: true });

        } catch (error) {
            handleDBErrors(error, 'remove - course-group-student');
        }
    }

} 