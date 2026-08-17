export function AmbientBackground() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="aurora-orb aurora-orb--teal" />
      <div className="aurora-orb aurora-orb--blue" />
      <div className="aurora-orb aurora-orb--violet" />
    </div>
  );
}
