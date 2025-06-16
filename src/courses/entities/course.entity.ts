import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CourseGroup } from "./course-group.entity";

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100 })
    name: string;

    @OneToMany(() => CourseGroup, (courseGroup) => courseGroup.course)
    coursesGroups: CourseGroup[];

    @Column({ default: false })
    isDeleted: boolean;
}
