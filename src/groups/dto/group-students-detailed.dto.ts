export class PartialEvaluationGradeDto {
  id: number;
  grade: number;
}

export class PartialEvaluationDto {
  id: number;
  name: string;
  partial: number;
  type: string;
  slot: number;
  grades: PartialEvaluationGradeDto[];
}

export class PartialGradeDto {
  id: number;
  partial: number;
  grade: number;
  date: Date;
}

export class CourseDto {
  id: number;
  name: string;
  semester: number;
  partialGrades: PartialGradeDto[];
  partialEvaluations: PartialEvaluationDto[];
}

export class StudentDto {
  id: number;
  fullName: string;
  registrationNumber: string;
  courses: CourseDto[];
}

export class GroupDetailedDto {
  id: number;
  name: string;
  semester: number;
  period: {
    id: number;
    name: string;
  };
  students: StudentDto[];
}

export class GroupStudentsDetailedResponseDto {
  groups: GroupDetailedDto[];
  total: number;
}
