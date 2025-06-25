import { Injectable, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseGroup } from "../entities/course-group.entity";
import { Repository } from "typeorm";
import { CreateCourseGroupDto } from "../dto/create-course-group.dto";
import { handleDBErrors } from "src/utils/errors";
import { CoursesService } from "./courses.service";
import { GroupsService } from "src/groups/groups.service";
import { UsersService } from "src/users/services/users.service";
import { UpdateCourseGroupDto } from "../dto/update-course-group.dto";
import { PaginationDto } from "src/core/dtos/pagination.dto";
import { CourseValidator } from "../validators/course.validator";

@Injectable()
export class CoursesGroupsService {
  constructor(
    @InjectRepository(CourseGroup)
    private readonly courseGroupRepository: Repository<CourseGroup>,

    @Inject(forwardRef(() => CoursesService))
    private readonly courseService: CoursesService,

    private readonly groupService: GroupsService,
    private readonly userService: UsersService,
    private readonly courseValidator: CourseValidator,
  ) {}

  async create(createCourseGroupDto: CreateCourseGroupDto) {
    const { courseId, groupId, userId, schedule } = createCourseGroupDto;

    const course = await this.courseService.findOne(courseId);
    const group = await this.groupService.findOne(groupId);
    const user = await this.userService.findOne(userId);

    // Validación para saber si ya hay un registro con el mismo courseId, groupId, userId y Schedule (horario)
    await this.courseValidator.checkDuplicateUserAssignment(
      course,
      group,
      user,
      schedule,
    );

    try {
      const courseGroup = this.courseGroupRepository.create({
        course,
        group,
        user,
        schedule
      });
      await this.courseGroupRepository.save(courseGroup);

      return courseGroup;

    } catch (error) {
      handleDBErrors(error, 'create - course-group');
    }
  }

  async findAllByCourse(courseId: number, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const course = await this.courseService.findOne(courseId);

    try {
      return await this.courseGroupRepository.find({
        where: { course, isDeleted: false },
        take: limit,
        skip: offset,
        relations: {
          course: true,
          group: { period: true },
          user: true,
          coursesGroupsGradingschemes: true,
        },
      });

    } catch (error) {
      handleDBErrors(error, 'findAll - courses-groups');
    }
  }

  async findOne(id: number) {
    const courseGroup = await this.courseGroupRepository.findOne({
      where: { id, isDeleted: false },
      relations: { course: true, group: true, user: true, coursesGroupsStudents: { student: true }, coursesGroupsGradingschemes: true },
    });
    if (!courseGroup) throw new NotFoundException(`Course Group with id: ${ id } not found`);

    return courseGroup;
  }

  async update(id: number, updateCourseGroupDto: UpdateCourseGroupDto) {
    const courseGroup = await this.findOne(id);

    const { courseId, groupId, userId } = updateCourseGroupDto;
    
    // Solo actualizar si los IDs son diferentes
    if (courseId && courseId !== courseGroup.course.id) {
      courseGroup.course = await this.courseService.findOne(courseId);
    }
    if (groupId && groupId !== courseGroup.group.id) {
      courseGroup.group = await this.groupService.findOne(groupId);
    }
    if (userId && userId !== courseGroup.user.id) {
      courseGroup.user = await this.userService.findOne(userId);
    }

    try {
      await this.courseGroupRepository.save(courseGroup);
      return courseGroup;
    } catch (error) {
      handleDBErrors(error, 'update - course-group');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    
    try {
      await this.courseGroupRepository.update(id, { isDeleted: true });

    } catch (error) {
      handleDBErrors(error, 'remove - course-group');
    }
  }

  async removeByCourseId(courseId: number) {
    try {
      await this.courseGroupRepository.update(
        { course: { id: courseId }, isDeleted: false },
        { isDeleted: true }
      );
    } catch (error) {
      handleDBErrors(error, 'removeByCourseId - course-group');
    }
  }
}