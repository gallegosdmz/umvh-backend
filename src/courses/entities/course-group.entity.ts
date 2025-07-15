import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Course } from "./course.entity";
import { Group } from "src/groups/entities/group.entity";
import { User } from "src/users/entities/user.entity";
import { CourseGroupStudent } from "./course-group-student.entity";
import { CourseGroupGradingscheme } from "./course-group-gradingscheme.entity";
import { PartialEvaluation } from "src/partial-evaluations/entities/partial-evaluation.entity";

@Entity('course_groups')
export class CourseGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Course, (course) => course.coursesGroups)
    course: Course;

    @ManyToOne(() => Group, (group) => group.coursesGroups)
    group: Group;

    @ManyToOne(() => User, (user) => user.coursesGroups)
    user: Omit<User, 'password'>;

    @OneToMany(() => CourseGroupStudent, (courseGroupStudent) => courseGroupStudent.courseGroup)
    coursesGroupsStudents: CourseGroupStudent[];

    @OneToMany(() => CourseGroupGradingscheme, (courseGroupGradingscheme) => courseGroupGradingscheme.courseGroup)
    coursesGroupsGradingschemes: CourseGroupGradingscheme[];

    @OneToMany(() => PartialEvaluation, (partialEvaluation) => partialEvaluation.courseGroup)
    partialEvaluations: PartialEvaluation[];

    @Column('varchar', { length: 150 })
    schedule: string;

    @Column({ default: false })
    isDeleted: boolean;
}