export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-serif text-3xl">Video: {slug}</h1>
      <p className="mt-2 opacity-70">Segera hadir.</p>
    </main>
  );
}