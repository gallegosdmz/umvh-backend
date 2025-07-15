import { Body, Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { PartialEvaluationGradeService } from "../services/partial-evaluation-grade.service";
import { Auth } from "src/users/decorators/auth.decorator";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { CreatePartialEvaluationGradeDto } from "../dto/create-partial-evaluation-grade.dto";
import { GetUser } from "src/users/decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";
import { UpdatePartialEvaluationGradeDto } from "../dto/update-partial-evaluation-grade.dto";

@Controller('partial-evaluation-grades')
export class PartialEvaluationGradesController {
    constructor(private readonly partialEvaluationGradesService: PartialEvaluationGradeService) {}

    @Post()
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    create(
        @Body() createPartialEvaluationGradeDto: CreatePartialEvaluationGradeDto,
        @GetUser() user: User
    ) {
        return this.partialEvaluationGradesService.create(createPartialEvaluationGradeDto, user);
    }

    @Patch(':id')
    @Auth(ValidRoles.administrador, ValidRoles.maestro)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePartialEvaluationGradeDto: UpdatePartialEvaluationGradeDto
    ) {
        return this.partialEvaluationGradesService.update(id, updatePartialEvaluationGradeDto);
    }
}