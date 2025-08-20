export interface OptimizedEvaluationsDataResponse {
  // ✅ Estudiantes con datos mínimos necesarios
  students: Array<{
    id: number;
    fullName: string;
    registrationNumber: string;
    courseGroupStudentId: number;
    semester: number;
  }>;
  
  // ✅ Calificaciones parciales por estudiante
  partialGrades: Array<{
    id: number;
    courseGroupStudentId: number;
    partial: number;
    grade: number;
    date: string | null;
  }>;
  
  // ✅ Asistencias agrupadas por estudiante y parcial
  attendances: Array<{
    id: number;
    courseGroupStudentId: number;
    partial: number;
    attend: number;
    date: string;
  }>;
  
  // ✅ Evaluaciones definidas (sin duplicar datos)
  partialEvaluations: Array<{
    id: number;
    name: string;
    type: string;
    slot: number;
    partial: number;
    courseGroupId: number;
  }>;
  
  // ✅ Esquema de ponderaciones
  gradingSchemes: Array<{
    id: number;
    type: string;
    percentage: number;
  }>;
  
  // ✅ Calificaciones de evaluaciones (DATOS PLANOS)
  partialEvaluationGrades: Array<{
    id: number;
    courseGroupStudentId: number;
    partialEvaluationId: number;
    grade: number;
    // ✅ Campos directos sin JOIN
    evaluationName: string;
    evaluationType: string;
    evaluationSlot: number;
    evaluationPartial: number;
  }>;
}
