import { CourseGroup } from "src/courses/entities/course-group.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {length: 100})
    fullName: string;

    @Column('varchar', {length: 100, unique: true})
    email: string;

    @Column('varchar', {length: 255})
    password: string;

    @Column('varchar', {length: 50, default: 'Maestro'})
    role: string;

    @OneToMany(() => CourseGroup, (courseGroup) => courseGroup.user)
    coursesGroups: CourseGroup[];

    @Column({default: false})
    isDeleted: boolean;
}