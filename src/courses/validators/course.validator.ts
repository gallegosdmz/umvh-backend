import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { BaseValidator } from "src/core/validators/base.validator";
import { Course } from "../entities/course.entity";
import { Group } from "src/groups/entities/group.entity";
import { User } from "src/users/entities/user.entity";
import { CourseGroup } from "../entities/course-group.entity";
import { Student } from "src/students/entities/student.entity";
import { CourseGroupStudent } from "../entities/course-group-student.entity";

@Injectable()
export class CourseValidator extends BaseValidator {
    async checkDuplicateUserAssignment(course: Course, group: Group, user: Omit<User, 'password'>, schedule: string) {
        // Validación de parámetros requeridos
        if (!course) throw new BadRequestException('El curso es requerido');
        if (!group) throw new BadRequestException('El grupo es requerido');
        if (!user) throw new BadRequestException('El usuario es requerido');
        if (!schedule) throw new BadRequestException('El horario es requerido');

        // Verificar si ya existe una asignación
        const existingAssignment = await this.dataSource.manager.findOne(CourseGroup, {
            where: { 
                course, 
                group, 
                user, 
                schedule, 
                isDeleted: false 
            },
        });

        if (existingAssignment) {
            throw new BadRequestException(
                'El usuario ya está asignado a este curso en el mismo horario y grupo'
            );
        }
    }

    async checkDuplicateStudentAssignment(courseGroup: CourseGroup, student: Student) {
        if (!courseGroup) throw new BadRequestException('Course Group is required');
        if (!student) throw new BadRequestException('Student is required');

        const existingAssignment = await this.dataSource.manager.findOne(CourseGroupStudent, {
            where: {
                courseGroup,
                student,
                isDeleted: false,
            },
        });

        if (existingAssignment) {
            throw new BadRequestException('Student is already assing to Course Group');
        }
    }

    async checkUserAssignToCourse(courseGroup: CourseGroup, user: User) {
        if (!courseGroup) throw new BadRequestException('Course Group is required');
        if (!user) throw new BadRequestException('User is required');

        if (courseGroup.user.id !== user.id) throw new UnauthorizedException('User is not authorized');
    }

}