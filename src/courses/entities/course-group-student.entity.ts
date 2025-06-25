import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroup } from "./course-group.entity";
import { Student } from "src/students/entities/student.entity";
import { CourseGroupAttendance } from "./course-group-attendance.entity";

@Entity('course_group_student')
export class CourseGroupStudent {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CourseGroup, (courseGroup) => courseGroup.coursesGroupsStudents)
    courseGroup: CourseGroup;

    @ManyToOne(() => Student, (student) => student.coursesGroupsStudents)
    student: Student;

    @OneToMany(() => CourseGroupAttendance, (courseGroupAttendance) => courseGroupAttendance.courseGroupStudent)
    coursesGroupsAttendances: CourseGroupAttendance[];

    @Column({ default: false })
    isDeleted: boolean;
}