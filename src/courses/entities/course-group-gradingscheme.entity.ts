import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroup } from "./course-group.entity";

@Entity('course_group_gradingschemes')
export class CourseGroupGradingscheme {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CourseGroup, (courseGroup) => courseGroup.coursesGroupsGradingschemes)
    courseGroup: CourseGroup;

    @Column('varchar', { length: 50 })
    type: string;

    @Column('int')
    percentage: number;

    @Column({ default: false })
    isDeleted: boolean;
}