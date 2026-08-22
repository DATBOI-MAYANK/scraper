export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  type: JobType;
  salary: number;
  salaryLabel: string;
  tags: string[];
  applyUrl?: string;
  description?: string;
  colour?: string;
}
