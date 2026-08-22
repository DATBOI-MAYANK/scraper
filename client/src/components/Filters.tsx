import { Filter, MapPin, Wallet } from 'lucide-react';
import type { JobType } from '../data/jobs';

interface Props {
  type: JobType | 'All';
  setType: (type: JobType | 'All') => void;
  minimumSalary: number;
  setMinimumSalary: (value: number) => void;
  remoteOnly: boolean;
  setRemoteOnly: (value: boolean) => void;
}

export function Filters({ type, setType, minimumSalary, setMinimumSalary, remoteOnly, setRemoteOnly }: Props) {
  return <aside className="filter-panel h-fit p-5 md:sticky md:top-5">
    <p className="mb-5 flex items-center gap-2 font-black"><Filter size={19} /> FILTER JOBS</p>
    <label className="filter-label">Job type</label>
    <select className="brutal-select" value={type} onChange={(e) => setType(e.target.value as JobType | 'All')}>
      <option>All</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
    </select>
    <label className="filter-label"><Wallet size={16} /> Minimum salary: ₹{minimumSalary ? `${minimumSalary / 100000}L` : 'Any'}</label>
    <input className="salary-range" type="range" min="0" max="1800000" step="300000" value={minimumSalary} onChange={(e) => setMinimumSalary(Number(e.target.value))} />
    <label className="mt-6 flex cursor-pointer items-center gap-3 font-bold"><input className="check" type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} /><MapPin size={17} /> Remote only</label>
  </aside>;
}
