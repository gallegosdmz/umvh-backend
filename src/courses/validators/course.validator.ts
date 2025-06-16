import { BadRequestException, Injectable } from "@nestjs/common";
import { BaseValidator } from "src/core/validators/base.validator";
import { Course } from "../entities/course.entity";
import { Group } from "src/groups/entities/group.entity";
import { User } from "src/users/entities/user.entity";
import { CourseGroup } from "../entities/course-group.entity";

@Injectable()
export class CourseValidator extends BaseValidator {
    async checkDuplicateUserAssignment(course: Course, group: Group, user: Omit<User, 'password'>, schedule: string) {
        // Validación de parámetros requeridos
        if (!course) throw new BadRequestException('El curso es requerido');
        if (!group) throw new BadRequestException('El grupo es requerido');
        if (!user) throw new BadRequestException('El usuario es requerido');
        if (!schedule) throw new BadRequestException('El horario es requerido');

        console.log('estoy en la validación')

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

        console.log('pasé la validación')
    }
}