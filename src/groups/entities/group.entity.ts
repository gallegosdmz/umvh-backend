import { CourseGroup } from "src/courses/entities/course-group.entity";
import { Period } from "src/periods/entities/period.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 50 })
    name: string;

    @ManyToOne(() => Period, (period) => period.groups)
    period: Period;

    @OneToMany(() => CourseGroup, (courseGroup) => courseGroup.group)
    coursesGroups: CourseGroup[];

    @Column({ default: false })
    isDeleted: boolean;
}
