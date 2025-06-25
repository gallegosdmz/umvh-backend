import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroupGradingscheme } from "../entities/course-group-gradingscheme.entity";
import { Repository } from "typeorm";
import { CreateCourseGroupGradingschemeDto } from "../dto/create-course-group-gradingscheme.dto";
import { CoursesGroupsService } from "./courses-groups.service";
import { handleDBErrors } from "src/utils/errors";
import { UpdateCourseGroupGradingschemeDto } from "../dto/update-course-group-gradingscheme.dto";

@Injectable()
export class CoursesGroupsGradingschemesService {
    constructor(
        @InjectRepository(CourseGroupGradingscheme)
        private readonly courseGroupGradingschemeRepository: Repository<CourseGroupGradingscheme>,

        private readonly courseGroupService: CoursesGroupsService,
    ) {}

    async create(createCourseGroupGradingschemeDto: CreateCourseGroupGradingschemeDto) {
        const { courseGroupId, ...data } = createCourseGroupGradingschemeDto;

        const courseGroup = await this.courseGroupService.findOne(courseGroupId);

        try {
            const courseGroupGradingscheme = this.courseGroupGradingschemeRepository.create({
                ...data,
                courseGroup,
            });
            await this.courseGroupGradingschemeRepository.save(courseGroupGradingscheme);

            return courseGroupGradingscheme;

        } catch (error) {
            handleDBErrors(error, 'create - coursesGroupsGradingschemes');
        }
    }

    async findOne(id: number) {
        const courseGroupGradingscheme = await this.courseGroupGradingschemeRepository.findOne({
            where: { id, isDeleted: false },
            relations: { courseGroup: { course: true, group: true, user: true } }
        });
        if (!courseGroupGradingscheme) throw new NotFoundException(`Course Group Gradingscheme with id: ${ id } not found`);

        return courseGroupGradingscheme;
    }

    async update(id: number, updateCourseGroupGradingschemeDto: UpdateCourseGroupGradingschemeDto) {
        const courseGroupGradingscheme = await this.courseGroupGradingschemeRepository.preload({
            id,
            ...updateCourseGroupGradingschemeDto,
        });
        if (!courseGroupGradingscheme) throw new NotFoundException(`Course Group Gradingscheme with id: ${ id } not found`);

        try {
            await this.courseGroupGradingschemeRepository.save(courseGroupGradingscheme);
            return courseGroupGradingscheme;

        } catch (error) {
            handleDBErrors(error, 'update - coursesGroupsGradingschemes');
        }
    }

    async remove(id: number) {
        await this.findOne(id);

        try {
            await this.courseGroupGradingschemeRepository.update(id, { isDeleted: true });

        } catch (error) {
            handleDBErrors(error, 'remove - coursesGroupGradingscehems');
        }
    }

}