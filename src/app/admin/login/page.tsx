import { login } from "@/lib/actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mx-auto mt-20 max-w-sm space-y-4 rounded-lg bg-white/70 p-8 shadow">
      <h1 className="font-serif text-2xl">Masuk CMS</h1>
      {error && <p className="text-sm text-red-700">Email atau password salah.</p>}
      <input name="email" type="email" placeholder="Email" required className="w-full rounded border p-2" />
      <input name="password" type="password" placeholder="Password" required className="w-full rounded border p-2" />
      <button className="w-full rounded bg-charcoal py-2 text-cream hover:bg-gold-dark">Masuk</button>
    </form>
  );
}
