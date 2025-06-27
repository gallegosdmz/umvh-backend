import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroup } from "./course-group.entity";
import { Student } from "src/students/entities/student.entity";
import { CourseGroupAttendance } from "./course-group-attendance.entity";
import { PartialEvaluation } from "src/partial-evaluations/entities/partial-evaluation.entity";

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

    @OneToMany(() => PartialEvaluation, (partialEvaluation) => partialEvaluation.courseGroupStudent)
    partialEvaluations: PartialEvaluation[];

    @Column({ default: false })
    isDeleted: boolean;
}