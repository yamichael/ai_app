import TimeMap from './components/TimeMap';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          World Time Map
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Click anywhere on the map to see the current time at that location
        </p>
        <TimeMap className="rounded-lg shadow-xl" />
      </div>
    </main>
  );
}
