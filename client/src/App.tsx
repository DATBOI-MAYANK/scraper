import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowDown, Sparkles } from 'lucide-react';
import { Filters } from './components/Filters';
import { JobCard } from './components/JobCard';
import { Navbar } from './components/Navbar';
import type { Job, JobType } from './data/jobs';

type ApiJob = { sourceKey: string; job: { company?: string; role?: string; location?: string; remote?: boolean; type?: JobType; salaryMin?: number; salaryMax?: number; salaryLabel?: string; applyUrl?: string; description?: string; tags?: string[] } };
const colours = ['bg-[#c4f0ff]', 'bg-[#ffe39a]', 'bg-[#e4c6ff]', 'bg-[#baf5ce]', 'bg-[#ffb4d0]', 'bg-[#f9c9a5]'];
// Empty locally: Vite proxies /api to the backend. Set VITE_API_URL on Vercel.
const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function App() {
  const app = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<JobType | 'All'>('All');
  const [minimumSalary, setMinimumSalary] = useState(0);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ minimumSalary: String(minimumSalary), remoteOnly: String(remoteOnly) });
    if (type !== 'All') params.set('type', type);
    setLoading(true); setError(undefined);
    fetch(`${apiBaseUrl}/api/jobs?${params}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load jobs'); return response.json() as Promise<{ results: ApiJob[] }>; })
      .then(({ results }) => setJobs(results.map(({ sourceKey, job }, index) => ({ id: sourceKey, company: job.company ?? 'Unknown company', role: job.role ?? 'Untitled role', location: job.location ?? 'Location not provided', remote: Boolean(job.remote), type: job.type ?? 'Full-time', salary: job.salaryMax ?? 0, salaryLabel: job.salaryLabel ?? (job.salaryMax ? `Up to ₹${(job.salaryMax / 100000).toFixed(1)}L` : 'Salary not listed'), tags: job.tags ?? [], applyUrl: job.applyUrl, description: job.description, colour: colours[index % colours.length] })) ))
      .catch((fetchError: Error) => { if (fetchError.name !== 'AbortError') setError(fetchError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type, minimumSalary, remoteOnly]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from('.hero-pop', { y: 30, opacity: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' });
    }, app);
    return () => context.revert();
  }, []);

  // Job cards appear only after the API response, so animate them after they exist.
  useEffect(() => {
    const cards = app.current?.querySelectorAll('.job-card');
    if (!cards?.length) return;
    const animation = gsap.from(cards, { y: 28, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.3)' });
    return () => { animation.kill(); };
  }, [jobs]);

  return <div ref={app} id="home" className="min-h-screen overflow-x-hidden">
    <Navbar />
    <main>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-8 md:grid-cols-[1.35fr_.65fr] md:px-8 md:pt-16">
        <div><p className="hero-pop badge mb-5"><Sparkles size={16} /> CURATED FOR YOU</p><h1 className="hero-pop max-w-3xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">Find work that <span className="highlight">hits different.</span></h1><p className="hero-pop mt-6 max-w-xl text-lg font-medium">Fresh roles from ambitious companies, without the boring bits. Find your next great move.</p><a className="hero-pop brutal-button mt-8 inline-flex items-center gap-2 px-5 py-3" href="#companies">Explore jobs <ArrowDown size={18} /></a></div>
        <div className="hero-pop hero-sticker"><span>NO</span><strong>MORE</strong><span>MEH JOBS</span></div>
      </section>
      <section id="companies" className="border-y-3 border-black bg-[#f4f0ff]"><div className="mx-auto max-w-7xl px-5 py-12 md:px-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><p className="badge mb-3">OPEN ROLES</p><h2 className="text-3xl font-black tracking-tight">Companies hiring now</h2></div><p className="font-bold">{loading ? 'Loading roles…' : `${jobs.length} roles found`}</p></div><div className="grid gap-8 lg:grid-cols-[255px_1fr]"><Filters {...{ type, setType, minimumSalary, setMinimumSalary, remoteOnly, setRemoteOnly }} /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <JobCard key={job.id} job={job} />)}{!loading && !jobs.length && <div className="col-span-full border-3 border-black bg-white p-8 text-center font-black">{error ?? 'No jobs match those filters. Try broadening your search.'}</div>}</div></div></div></section>
      <section id="contact" className="mx-auto max-w-7xl px-5 py-16 text-center md:px-8"><p className="badge">KEEP IN TOUCH</p><h2 className="mt-4 text-4xl font-black tracking-tight">Your next job could be one click away.</h2><a href="mailto:hello@jobscout.dev" className="brutal-button mt-7 inline-block px-6 py-3">Contact us</a></section>
    </main>
  </div>;
}
