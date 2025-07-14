import { CourseGroupStudent } from "src/courses/entities/course-group-student.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('students')
export class Student {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100 })
    fullName: string;

    @Column('varchar', { length: 20 })
    registrationNumber: string;

    @OneToMany(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.student)
    coursesGroupsStudents: CourseGroupStudent[];

    @Column({ default: false })
    isDeleted: boolean;
}
