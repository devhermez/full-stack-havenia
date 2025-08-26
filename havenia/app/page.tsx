// app/page.tsx
export default function LandingPage() {
  return (
    <section className="w-screen min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-3xl px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
          Welcome to <span className="text-blue-600">Havenia</span>
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Book island rooms, enjoy activities, and dine in style — all in one seamless experience.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="/home"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </a>
          <a
            href="/activities"
            className="px-6 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-100 transition"
          >
            Explore Activities
          </a>
        </div>
      </div>
    </section>
  );
}