import { CourseGroup } from "src/courses/entities/course-group.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PartialEvaluationGrade } from "./partial-evaluation-grade.entity";

@Entity('partial_evaluations')
export class PartialEvaluation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100, nullable: true })
    name: string;

    @Column('varchar', { length: 50 })
    type: string;

    @Column('int')
    slot: number;

    @ManyToOne(() => CourseGroup, (courseGroup) => courseGroup.partialEvaluations)
    courseGroup: CourseGroup;

    @OneToMany(() => PartialEvaluationGrade, (partialEvaluationGrade) => partialEvaluationGrade.partialEvaluation)
    partialEvaluationGrades: PartialEvaluationGrade[];

    @Column({ default: false })
    isDeleted: boolean;
}
