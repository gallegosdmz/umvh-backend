import { Type } from "class-transformer";
import { IsInt, IsString, MaxLength } from "class-validator";

export class CreateCourseGroupGradingschemeDto {
    @IsInt()
    @Type(() => Number)
    courseGroupId: number; // Id del courseGroup al que va a pertencer la ponderación

    @IsString()
    @MaxLength(50)
    type: string; // Tipo de ponderación: Asistenca, Actividades, Evidencias, Producto o Examen 

    @IsInt()
    @Type(() => Number)
    percentage: number; // Porcentaje asignado a la ponderacion
}