import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PartialEvaluationGrade } from "../entities/partial-evaluation-grade.entity";
import { Repository } from "typeorm";
import { PeriodsService } from "src/periods/periods.service";
import { CreatePartialEvaluationGradeDto } from "../dto/create-partial-evaluation-grade.dto";
import { handleDBErrors } from "src/utils/errors";
import { PartialEvaluationsService } from "./partial-evaluations.service";
import { CoursesGroupsStudentsService } from "src/courses/services/courses-groups-students.service";
import { User } from "src/users/entities/user.entity";
import { UpdatePartialEvaluationGradeDto } from "../dto/update-partial-evaluation-grade.dto";

@Injectable()
export class PartialEvaluationGradeService {
    constructor(
        @InjectRepository(PartialEvaluationGrade)
        private readonly partialEvaluationGradeRepository: Repository<PartialEvaluationGrade>,

        private readonly periodService: PeriodsService,
        private readonly partialEvaluationervice: PartialEvaluationsService,
        private readonly courseGroupStudentService: CoursesGroupsStudentsService,
    ) {}

    async create(createPartialEvaluationGradeDto: CreatePartialEvaluationGradeDto, user: User) {
        const { partialEvaluationId, courseGroupStudentId, ...data } = createPartialEvaluationGradeDto;

        const partialEvaluation = await this.partialEvaluationervice.findOne(partialEvaluationId);
        await this.checkStatusPeriod(partialEvaluation.courseGroup.group.period.id, data.partial);

        const courseGroupStudent = await this.courseGroupStudentService.findOne(courseGroupStudentId, user);

        try {
            const partialEvaluationGrade = this.partialEvaluationGradeRepository.create({
                ...data,
                partialEvaluation,
                courseGroupStudent,
            });
            await this.partialEvaluationGradeRepository.save(partialEvaluationGrade);

            return partialEvaluationGrade;

        } catch (error) {
            handleDBErrors(error, 'create - partialEvaluationGrades');
        }
    }

    async update(id: number, updatePartialEvaluationGradeDto: UpdatePartialEvaluationGradeDto) {
        const { partialEvaluationId, courseGroupStudentId, ...data } = updatePartialEvaluationGradeDto;

        const partialEvaluationGrade = await this.partialEvaluationGradeRepository.findOne({
            where: { id },
            relations: { partialEvaluation: { courseGroup: { group: { period: true } } } }
        });
        if (!partialEvaluationGrade) throw new NotFoundException(`Partial Evaluation Grade with id: ${ id } not found`);

        await this.checkStatusPeriod(partialEvaluationGrade.partialEvaluation.courseGroup.group.period.id, data.partial!);

        Object.assign(partialEvaluationGrade, data);

        try {
            await this.partialEvaluationGradeRepository.save(partialEvaluationGrade);

            return partialEvaluationGrade;

        } catch (error) {
            handleDBErrors(error, 'update - partialEvaluationGrades');
        } 
    }

    private async checkStatusPeriod(periodId: number, periodPartial: number) {
        const period = await this.periodService.findOne(periodId);
        if (!period) throw new NotFoundException(`Period with id: ${ periodId } not found`);
    
        if (periodPartial === 1 && period.firstPartialActive ) return true;
        if (periodPartial === 2 && period.secondPartialActive ) return true;
        if (periodPartial === 3 && period.thirdPartialActive ) return true;
    
        throw new UnauthorizedException(`The period: ${ periodPartial } si closed`);
      }
}