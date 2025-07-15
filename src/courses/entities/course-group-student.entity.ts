import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroup } from "./course-group.entity";
import { Student } from "src/students/entities/student.entity";
import { CourseGroupAttendance } from "./course-group-attendance.entity";
import { PartialGrade } from "src/partial-grades/entities/partial-grade.entity";
import { FinalGrade } from "src/final-grades/entities/final-grade.entity";
import { PartialEvaluationGrade } from "src/partial-evaluations/entities/partial-evaluation-grade.entity";

@Entity('course_group_students')
export class CourseGroupStudent {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CourseGroup, (courseGroup) => courseGroup.coursesGroupsStudents)
    courseGroup: CourseGroup;

    @ManyToOne(() => Student, (student) => student.coursesGroupsStudents)
    student: Student;

    @OneToMany(() => CourseGroupAttendance, (courseGroupAttendance) => courseGroupAttendance.courseGroupStudent)
    coursesGroupsAttendances: CourseGroupAttendance[];

    @OneToMany(() => PartialEvaluationGrade, (partialEvaluationGrade) => partialEvaluationGrade.courseGroupStudent)
    partialEvaluationGrades: PartialEvaluationGrade[];

    @OneToMany(() => PartialGrade, (partialGrade) => partialGrade.courseGroupStudent)
    partialGrades: PartialGrade[];

    @OneToMany(() => FinalGrade, (finalGrade) => finalGrade.courseGroupStudent)
    finalGrades: FinalGrade[];

    @Column({ default: false })
    isDeleted: boolean;
}