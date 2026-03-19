import Image from "next/image";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-gray-500">
            Manage your application features in real-time
          </p>
        </div>
        <button>+ Create Flag</button>
      </header>
    </main>
  );
}
