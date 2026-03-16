import { SignOutButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-8">
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
        Dashboard BrainMarket
      </h1>
      <SignOutButton>
        <button className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors duration-200">
          Se déconnecter
        </button>
      </SignOutButton>
    </main>
  );
}
