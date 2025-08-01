import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCourseGroupDto {
  @IsNotEmpty()
  @IsInt()
  courseId: number;

  @IsNotEmpty()
  @IsInt()
  groupId: number;

  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  schedule: string;
}