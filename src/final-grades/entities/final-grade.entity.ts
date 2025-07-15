import { CourseGroupStudent } from "src/courses/entities/course-group-student.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('final_grades')
export class FinalGrade {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int')
    grade: number;

    @Column('int', { nullable: true })
    gradeOrdinary: number;

    @Column('int', { nullable: true })
    gradeExtraordinary: number;

    @Column('date')
    date: Date;

    @Column('varchar', { length: 50 })
    type: string;

    @ManyToOne(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.finalGrades)
    courseGroupStudent: CourseGroupStudent;

    @Column({ default: false })
    isDeleted: boolean;
}
