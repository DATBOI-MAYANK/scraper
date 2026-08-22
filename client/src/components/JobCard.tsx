import { ArrowUpRight, MapPin, Wifi } from 'lucide-react';
import type { Job } from '../data/jobs';

export function JobCard({ job }: { job: Job }) {
  return <article className={`job-card ${job.colour ?? 'bg-[#c4f0ff]'} p-5`}>
    <div className="mb-9 flex justify-between gap-3"><span className="border-2 border-black bg-white px-2 py-1 text-xs font-black">{job.type}</span><button className="icon-button" aria-label={`View ${job.role} at ${job.company}`}><ArrowUpRight size={19} /></button></div>
    <p className="font-bold">{job.company}</p><h3 className="mt-1 text-xl font-black leading-tight">{job.role}</h3>
    <div className="mt-5 space-y-2 text-sm font-bold"><p className="flex gap-2"><MapPin size={17} />{job.location}</p><p className="flex gap-2"><Wifi size={17} />{job.remote ? 'Remote friendly' : 'On-site'}</p></div>
    <div className="mt-5 flex flex-wrap gap-2">{job.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
    <div className="mt-5 flex items-center justify-between border-t-2 border-black pt-4"><span className="font-black">{job.salaryLabel}</span><button className="font-black underline decoration-2 underline-offset-4">Details</button></div>
  </article>;
}
