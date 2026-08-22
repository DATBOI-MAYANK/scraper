export function Navbar() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      <a href="#home" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="grid h-9 w-9 place-items-center border-3 border-black bg-[#ff5c98] text-lg shadow-brutal">✦</span>JOB SCOUT</a>
      <nav className="hidden gap-7 font-bold md:flex" aria-label="Main navigation">
        <a className="nav-link" href="#home">Home</a><a className="nav-link" href="#companies">Companies</a><a className="nav-link" href="#contact">Contact</a>
      </nav>
      <a href="#companies" className="brutal-button px-4 py-2 text-sm">Find jobs</a>
    </header>
  );
}
