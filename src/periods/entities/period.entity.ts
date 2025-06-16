import { Group } from "src/groups/entities/group.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('periods')
export class Period {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100 })
    name: string;

    @Column('date')
    startDate: Date;

    @Column('date')
    endDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Group, (group) => group.period)
    groups: Group[];

    @Column({ default: false })
    isDeleted: boolean;
}
