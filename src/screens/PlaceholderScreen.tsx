export function PlaceholderScreen({ title, note }: { title: string; note: string }) {
  return (
    <section className="content">
      <h1>{title}</h1>
      <p className="muted">{note}</p>
    </section>
  );
}
