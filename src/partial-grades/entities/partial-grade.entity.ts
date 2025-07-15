import { CourseGroupStudent } from "src/courses/entities/course-group-student.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('partial_grades')
export class PartialGrade {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int')
    partial: number;

    @Column('float')
    grade: number;

    @Column('date')
    date: Date;

    @ManyToOne(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.partialGrades)
    courseGroupStudent: CourseGroupStudent;

    @Column({ default: false })
    isDeleted: boolean;
}
