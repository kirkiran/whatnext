type PlaceholderSectionProps = {
  title: string;
};

export function PlaceholderSection({ title }: PlaceholderSectionProps) {
  return (
    <section className="min-h-[260px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-full flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50" />
      </div>
    </section>
  );
}
