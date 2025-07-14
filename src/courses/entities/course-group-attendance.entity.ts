import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroupStudent } from "./course-group-student.entity";

@Entity('course_group_attendance')
export class CourseGroupAttendance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.coursesGroupsAttendances)
    courseGroupStudent: CourseGroupStudent;

    @Column('int')
    partial: number;

    @Column('date')
    date: Date;

    @Column('int')
    attend: number;
}