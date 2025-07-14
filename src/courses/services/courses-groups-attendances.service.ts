import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroupAttendance } from "../entities/course-group-attendance.entity";
import { Repository } from "typeorm";
import { CoursesGroupsStudentsService } from "./courses-groups-students.service";
import { CreateCourseGroupAttendanceDto } from "../dto/create-course-group-attendance.dto";
import { User } from "src/users/entities/user.entity";
import { handleDBErrors } from "src/utils/errors";
import { NotFoundException } from "@nestjs/common";
import { UpdateCourseGroupAttendanceDto } from "../dto/update-course-group-attendance.dto";

export class CoursesGroupsAttendancesService {
    constructor(
        @InjectRepository(CourseGroupAttendance)
        private readonly courseGroupAttendanceRepository: Repository<CourseGroupAttendance>,

        private readonly courseGroupStudentService: CoursesGroupsStudentsService,
    ) {}

    async create(createCourseGroupAttendanceDto: CreateCourseGroupAttendanceDto, user: User) {
        const { courseGroupStudentId, ...data } = createCourseGroupAttendanceDto;
        const courseGroupStudent = await this.courseGroupStudentService.findOne(courseGroupStudentId, user);

        try {
            const courseGroupAttendance = this.courseGroupAttendanceRepository.create({
                courseGroupStudent,
                ...data,
            });
            await this.courseGroupAttendanceRepository.save(courseGroupAttendance);

            return courseGroupAttendance;

        } catch (error) {
            handleDBErrors(error, 'create - coursesGroupsAttendances');
        }
    }

    async findAllByCourseGroupAndDate(courseGroupId: number, date: Date) {
        try {
            const attendances = await this.courseGroupAttendanceRepository.find({
                where: {
                    courseGroupStudent: {
                        courseGroup: { id: courseGroupId, isDeleted: false }
                    },
                    date: date
                },
                relations: {
                    courseGroupStudent: {
                        courseGroup: true,
                        student: true
                    }
                }
            });

            return attendances;

        } catch (error) {
            handleDBErrors(error, 'findAll - coursesGroupsAttendances');
        }
    }

    async findAllByStudent(courseGroupStudentId: number, partial: number) {
        console.log(partial);
        try {
            return await this.courseGroupAttendanceRepository.find({
                where: { courseGroupStudent: { id: courseGroupStudentId }, partial },
                relations: { courseGroupStudent: { courseGroup: { group: true, course: true } } }
            });
        } catch (error) {
            handleDBErrors(error, 'findAllByStudent - courseGroupAttendances');
        }
    }

    async findOne(id: number) {
        const courseGroupAttendance = await this.courseGroupAttendanceRepository.findOne({
            where: { id },
        });
        if (!courseGroupAttendance) throw new NotFoundException(`Course Group Attendance with id: ${ id } not found`);

        return courseGroupAttendance;
    }

    async update(id: number, updateCourseGroupAttendanceDto: UpdateCourseGroupAttendanceDto, user: User) {
        console.log(updateCourseGroupAttendanceDto);
        const { courseGroupStudentId, ...details } = updateCourseGroupAttendanceDto;

        const courseGroupAttendance = await this.courseGroupAttendanceRepository.preload({
            id,
            ...details
        });
        if (!courseGroupAttendance) throw new NotFoundException(`Course Group Attendance with id: ${ id } not found`);

        try {
            await this.courseGroupAttendanceRepository.save(courseGroupAttendance);
            return courseGroupAttendance;

        } catch (error) {
            handleDBErrors(error, 'update - coursesGruposAttendances');
        }
    }
}