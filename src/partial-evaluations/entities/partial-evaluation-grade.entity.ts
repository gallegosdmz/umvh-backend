import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PartialEvaluation } from "./partial-evaluation.entity";
import { CourseGroupStudent } from "src/courses/entities/course-group-student.entity";

@Entity('partial_evaluation_grades')
export class PartialEvaluationGrade {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int')
    partial: number;

    @Column('float')
    grade: number;

    @ManyToOne(() => PartialEvaluation, (partialEvaluation) => partialEvaluation.partialEvaluationGrades)
    partialEvaluation: PartialEvaluation;

    @ManyToOne(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.partialEvaluationGrades)
    courseGroupStudent: CourseGroupStudent;
}