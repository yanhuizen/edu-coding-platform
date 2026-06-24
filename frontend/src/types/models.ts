// 与后端约定的共享类型

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  role: UserRole;
  classId?: string;
  createdAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  contentMd: string;
  codeExample: string;
  order: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  coverEmoji: string;
  order: number;
  lessons: Lesson[];
  createdBy: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  prompt: string;
  starterCode: string;
  expectedOutput?: string;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'pending' | 'passed' | 'failed' | 'graded';

export interface Submission {
  _id: string;
  studentId: string | User;
  assignmentId: string | Pick<Assignment, '_id' | 'title' | 'courseId' | 'totalScore'>;
  code: string;
  output: string;
  status: SubmissionStatus;
  score?: number;
  teacherComment?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}
