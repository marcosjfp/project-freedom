export function ProjectHeader() {
  return (
    <header className="project-header">
      <svg
        className="project-mark"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="38" height="38" rx="12" />
        <path d="M14 28V12h12M14 20h10" />
      </svg>
      <div>
        <p className="eyebrow">A more intentional internet</p>
        <h1 id="project-title">Project Freedom</h1>
      </div>
    </header>
  );
}
