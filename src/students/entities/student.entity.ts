import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('students')
export class Student {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100 })
    fullName: string;

    @Column('int')
    semester: number;

    @Column('varchar', { length: 20 })
    registrationNumber: string;

    @Column({ default: false })
    isDeleted: boolean;
}
