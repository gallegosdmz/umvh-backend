import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PartialEvaluationGrade } from "../entities/partial-evaluation-grade.entity";
import { Repository } from "typeorm";
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

        private readonly partialEvaluationervice: PartialEvaluationsService,
        private readonly courseGroupStudentService: CoursesGroupsStudentsService,
    ) {}

    async create(createPartialEvaluationGradeDto: CreatePartialEvaluationGradeDto, user: User) {
        const { partialEvaluationId, courseGroupStudentId, ...data } = createPartialEvaluationGradeDto;

        const partialEvaluation = await this.partialEvaluationervice.findOne(partialEvaluationId);

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

        Object.assign(partialEvaluationGrade, data);

        try {
            await this.partialEvaluationGradeRepository.save(partialEvaluationGrade);

            return partialEvaluationGrade;

        } catch (error) {
            handleDBErrors(error, 'update - partialEvaluationGrades');
        } 
    }
}