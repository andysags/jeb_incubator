// Footer rendered globally in _app.tsx

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos</h1>
          <p className="text-gray-600">Page en construction</p>
        </div>
      </div>
  {/* Footer moved to _app.tsx */}
    </div>
  );
}