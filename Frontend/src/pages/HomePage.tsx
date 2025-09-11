import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";
// Footer is rendered globally in _app.tsx
import { FaBuilding, FaChartLine, FaUser, FaLightbulb } from "react-icons/fa";

// Helper: return up to 3 most recent items. Tries to use `date`/`Date`/`created` fields.
function topThree(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const copy = [...items];
  copy.sort((a, b) => {
    const getDate = (x: any) => {
      const d = x.date || x.Date || x.created || x.created_at || x.published_at || x.published;
      return d ? new Date(d).getTime() : 0;
    };
    return getDate(b) - getDate(a);
  });
  return copy.slice(0, 3);
}

// Format a date string/timestamp into a readable FR string.
function formatDate(d: any) {
  if (!d) return '';
  try {
    const date = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    // e.g. 9 sept. 2025 à 14:42
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace(',', ' à');
  } catch (e) {
    return '';
  }
}

// Try a list of endpoints in order and return parsed JSON or [] on failure.
async function fetchFirstJSON(urls: string[]) {
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (r.status === 404) {
        // try next candidate
        continue;
      }
      if (!r.ok) {
        continue;
      }
      const data = await r.json();
      return data;
    } catch (e) {
      // network error -> try next
      continue;
    }
  }
  return [];
}

function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [startupsData, setStartupsData] = useState<any[]>([]);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  // Header is rendered globally by index.jsx; do not access `window`/`document` here to avoid SSR/client mismatch.
  // (No Header render in this component.)

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      setIsAuthenticated(!!token);
    } catch (e) {
      setIsAuthenticated(false);
    }

    // fetch startups and news from backend (tolerant to multiple possible endpoints)
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

    // startups (keep previous behavior)
    fetch(`${base}/api/startups/`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        const arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
        setStartupsData(topThree(arr));
      })
      .catch(() => {/* keep fallback */});

    // news: backend exposes '/api/actualites/' (French) or '/api/news/' in some setups
    (async () => {
      const newsUrls = [
        `${base}/api/actualites/`,
        `${base}/api/news/`,
        `${base}/api/v1/news/`,
        `${base}/news/`
      ];
      const newsRaw = await fetchFirstJSON(newsUrls);
      const newsArr = Array.isArray(newsRaw) ? newsRaw : (Array.isArray((newsRaw as any).results) ? (newsRaw as any).results : []);
      setNewsData(topThree(newsArr));

      const eventsUrls = [
        `${base}/api/evenements/`,
        `${base}/api/events/`,
        `${base}/api/v1/events/`,
        `${base}/events/`
      ];
      const eventsRaw = await fetchFirstJSON(eventsUrls);
      const eventsArr = Array.isArray(eventsRaw) ? eventsRaw : (Array.isArray((eventsRaw as any).results) ? (eventsRaw as any).results : []);
      setEventsData(topThree(eventsArr));
    })();

  // top-level Header is rendered in _app.tsx; no local header needed here.
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
    } catch (e) {}
    setIsAuthenticated(false);
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section modernisé */}
  <section className="relative bg-gradient-to-br from-rose-100 to-rose-60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Innovation starts at <span className="text-primary">JEB</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover the most promising startups and connect with the French entrepreneurial ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 flex items-center gap-2 transition-all duration-300"
                  onClick={() => window.location.href = "/StartupsPage"}
                >
                  Discover startups
                  <span className="ml-2">→</span>
                </button>
                <button
                  className="bg-white border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300"
                  onClick={() => setShowPartnerModal(true)}
                >
                  Become a partner
                </button>
              </div>
            </div>
            <div className="relative">
              <img
                src="/space_lab.jpg"
                alt="Modern workspace"
                className="rounded-lg shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <Stats />
  <Startups items={startupsData} />
      <Events items={eventsData} />
      <News items={newsData} />
      {showPartnerModal && (
        <PartnerModal onClose={() => setShowPartnerModal(false)} />
      )}
      </div>
  {/* Footer moved to _app.tsx */}
    </div>
  );
}

function Stats() {
  const data = [
    { number: "150+", label: "Incubated startups", icon: <FaBuilding className="text-4xl text-rose-300" /> },
    { number: "45M€", label: "Millions raised", icon: <FaChartLine className="text-4xl text-rose-300" /> },
    { number: "500+", label: "Entrepreneurs", icon: <FaUser className="text-4xl text-rose-300" /> },
    { number: "200+", label: "Innovations", icon: <FaLightbulb className="text-4xl text-rose-300" /> },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center my-12">
      {data.map((item, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="mb-4 flex justify-center">{item.icon}</div>
          <h3 className="text-3xl font-bold text-black-300">{item.number}</h3>
          <p className="text-gray-600 mt-2">{item.label}</p>
        </div>
      ))}
    </section>
  );
}

function Startups({ items = [] } : { items?: any[] }) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Startups</h2>
          <p className="text-xl text-gray-600">
            Discover our most promising startups
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((startup, i) => (
            <div 
              key={startup.id || i}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white rounded-xl shadow-md border border-gray-100"
              style={{ minWidth: 320 }}
            >
              <div className="flex items-center space-x-4 p-6 pb-0">
                <img
                  src={startup.image || startup.Image || '/space_lab.jpg'}
                  alt={startup.nom || startup.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{startup.nom || startup.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{startup.localisation || startup.ville || startup.city || startup.address || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex flex-col justify-between h-[140px]">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{startup.description_courte || startup.desc}</p>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {startup.secteur || startup.tag}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {startup.stade || startup.stage}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button className="text-primary hover:underline transition-colors duration-300 text-sm font-medium">
                    Learn more →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button 
            className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300"
            onClick={() => window.location.href = "/StartupsPage"}
          >
            See all startups
          </button>
        </div>
      </div>
    </section>
  );
}


function News({ items = [] } : { items?: any[] }) {
  return (
    <section className="px-8 py-16 bg-white">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Latest News</h2>
          <p className="text-gray-600 text-lg">Stay informed about the ecosystem</p>
        </div>
        <button onClick={() => window.location.href = '/NewsPage'} className="bg-white text-[#F18585] border border-[#F18585] px-6 py-2 rounded-md hover:bg-[#F18585] hover:text-white transition-all duration-300 font-semibold shadow-sm hover:shadow-md">
          See all news
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((n, i) => {
          const img = n.image || n.Image || n.image_url || n.ImageUrl || '/space_lab.jpg';
          const date = n.date || n.Date || n.publie_le || n.published_at || n.publie || '';
          const title = n.title || n.Title || n.titre || `News-${n.id || i}`;
          const desc = n.description || n.Description || n.contenu || n.Content || '';
          return (
            <div key={n.id || i} className="bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 max-w-xs mx-auto overflow-hidden border border-gray-100">
              <div className="h-48">
                <img src={img} alt={title} className="w-full h-full object-cover"/>
              </div>
              <div className="h-48 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-500">{formatDate(date)}</p>
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-gray-800">{title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">{desc}</p>
                </div>
                <button className="text-[#F18585] hover:text-[#F49C9C] font-medium text-sm mt-3">Read more →</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HomePage;

function Events({ items = [] } : { items?: any[] }) {
  return (
    <section className="px-8 py-16 bg-white">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600 text-lg">Don't miss our next meetups and workshops</p>
        </div>
        <button onClick={() => window.location.href = '/EventsPage'} className="bg-white text-[#F18585] border border-[#F18585] px-6 py-2 rounded-md hover:bg-[#F18585] hover:text-white transition-all duration-300 font-semibold shadow-sm hover:shadow-md">
          See all events
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((e, i) => (
          <div key={e.id || i} className="bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 max-w-xs mx-auto overflow-hidden border border-gray-100">
            <div className="h-40 bg-gray-50 flex items-center justify-center text-gray-400">{e.image ? <img src={e.image} alt={e.title || e.Name} className="w-full h-full object-cover"/> : <div className="p-6">Event</div>}</div>
            <div className="h-48 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-3">
                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-500">{formatDate(e.date || e.Date || e.date_debut || e.start_date)}</p>
                </div>
                <h3 className="text-base font-semibold mb-2 text-gray-800">{e.title || e.Name}</h3>
                <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">{e.description || e.Description}</p>
              </div>
              <button className="text-[#F18585] hover:text-[#F49C9C] font-medium text-sm mt-3">More →</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Partner modal component
function PartnerModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<any>({
    name: '', legal_status: '', address: '', email: '', phone: '', description: '', partnership_type: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(`${base}/api/partners/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      setSuccess('Partner enregistré');
      console.log('Partner created', data);
      setTimeout(() => { setSubmitting(false); onClose(); }, 800);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Partner</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Legal status</label>
            <select value={form.legal_status} onChange={e => handleChange('legal_status', e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
              <option value="">Select...</option>
              <option value="SAS">SAS</option>
              <option value="SARL">SARL</option>
              <option value="SpA">SpA</option>
              <option value="LLC">LLC</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <input value={form.address} onChange={e => handleChange('address', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" rows={3} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Partnership type</label>
            <select value={form.partnership_type} onChange={e => handleChange('partnership_type', e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
              <option value="">Select...</option>
              <option value="Strategic">Strategic</option>
              <option value="Commercial">Commercial</option>
              <option value="Technology">Technology</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded border">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded bg-primary text-white">
            {submitting ? 'Saving...' : 'Submit'}
          </button>
        </div>
        {error && <p className="text-red-600 mt-3">{error}</p>}
        {success && <p className="text-green-600 mt-3">{success}</p>}
      </div>
    </div>
  );
}