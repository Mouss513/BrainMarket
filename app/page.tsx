import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            BrainMarket
          </h1>
          <p className="text-gray-400 text-xl">
            Ad intelligence, redefined.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="inline-block px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors duration-200"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
