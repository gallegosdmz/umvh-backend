import { CourseGroupStudent } from "src/courses/entities/course-group-student.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('partial_evaluation')
export class PartialEvaluation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100, nullable: true })
    name: string;

    @Column('float')
    grade: number;

    @Column('varchar', { length: 50 })
    type: string;

    @ManyToOne(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.partialEvaluations)
    courseGroupStudent: CourseGroupStudent;

    @Column({ default: false })
    isDeleted: boolean;
}
