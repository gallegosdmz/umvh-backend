import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Course } from "./course.entity";
import { Group } from "src/groups/entities/group.entity";
import { User } from "src/users/entities/user.entity";

@Entity('course_group')
export class CourseGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Course, (course) => course.coursesGroups)
    course: Course;

    @ManyToOne(() => Group, (group) => group.coursesGroups)
    group: Group;

    @ManyToOne(() => User, (user) => user.coursesGroups)
    user: Omit<User, 'password'>;

    @Column('varchar', { length: 150 })
    schedule: string;

    @Column({ default: false })
    isDeleted: boolean;
}