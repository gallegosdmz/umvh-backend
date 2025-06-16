import { IsInt, IsNotEmpty, IsString, MaxLength } from "class-validator";

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
  @MaxLength(100)
  schedule: string;
}