import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/router';
// Footer rendered globally in _app.tsx
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Search, MapPin, ArrowRight, Filter, Image as ImageIcon } from "lucide-react";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";

interface StartupsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}


export function StartupsPage({ onNavigate }: StartupsPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [currentPage, setCurrentPage] = useState("StartupsPage");

  const [allStartups, setAllStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // static fallbacks are provided if the fetched list is empty
  const defaultSectors = ["GreenTech", "HealthTech", "FinTech", "AgriTech", "EdTech"];
  const defaultStages = ["Pre-seed", "Seed", "Series A", "Series B"];
  // filter shows countries only (fallback list)
  const defaultCountries = ["France", "Spain", "Finland", "Portugal", "Belgium"];

  const sectors = useMemo(() => {
    const s = Array.from(new Set(allStartups.map(su => su.sector).filter(Boolean)));
    return s.length ? s : defaultSectors;
  }, [allStartups]);

  const stages = useMemo(() => {
    const s = Array.from(new Set(allStartups.map(su => su.stage).filter(Boolean)));
    return s.length ? s : defaultStages;
  }, [allStartups]);

  // compute countries for the location filter from full location strings
  const countries = useMemo(() => {
    const c = Array.from(new Set(allStartups.map(su => su.country).filter(Boolean)));
    return c.length ? c : defaultCountries;
  }, [allStartups]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
  fetch('/api/admin/startups')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
    // data may be { items: [...] } from our Next.js admin API or an array from a direct backend
    const rawList = Array.isArray(data) ? data : (data.items || data.results || []);
        const parseNeeds = (n: any) => {
          if (!n && n !== 0) return [];
          const stripQuotes = (s: string) => s.replace(/^\s*["']?/, '').replace(/["']?\s*$/, '').trim()
          if (Array.isArray(n)) return n.map((x: any) => stripQuotes(String(x))).filter(Boolean);
          if (typeof n === 'string') {
            // try JSON
            try {
              const parsed = JSON.parse(n);
              if (Array.isArray(parsed)) return parsed.map((x: any) => stripQuotes(String(x))).filter(Boolean);
            } catch (e) {
              // not JSON, fall back to CSV
            }
            return n.split(',').map((x: string) => stripQuotes(x)).filter(Boolean);
          }
          // fallback to string coercion
          return [stripQuotes(String(n))];
        };

        const mapped = rawList.map((s: any) => {
          // compute stage: try several possible field names that different backends may use
          const candidateStage = s.stage || s.stade || s.project_status || s.maturity || s.maturity_stage || s.status || s.tier || s.stage_name || s.stage_val || '';
          const stageVal = (candidateStage && String(candidateStage).trim()) || '';

          // location: keep full raw location for card display, and compute a country for filters
          const rawLoc = s.city || s.location|| s.location || s.address || ''
          let city = ''
          let country = ''
          let fullLocation = ''
          if (rawLoc) {
            fullLocation = String(rawLoc).trim()
            // city: take the first token before comma and clean numbers
            const first = fullLocation.split(',')[0].trim()
            city = first.replace(/\d+/g, '').replace(/(road|rd|st\.|street|blvd|boulevard|avenue|ave|rue)$/i, '').trim()
            // country: take last token after last comma
            const parts = fullLocation.split(',').map(p => p.trim()).filter(Boolean)
            country = parts.length > 1 ? parts[parts.length - 1].replace(/\d+/g,'').trim() : ''
            // normalize country capitalization (first letter uppercase)
            if (country) country = country.charAt(0).toUpperCase() + country.slice(1)
          }

          return {
            id: s.id,
            name: s.name || s.name,
            description: s.description || s.long_description || s.short_description || '',
            sector: (s.sector || s.sector || '') || '',
            stage: stageVal || 'Inconnu',
            // keep both the cleaned city (used for other logic) and the full location string
            location: city,
            fullLocation,
            country,
            logo: s.logo_url || s.logo || '',
            currentNeeds: parseNeeds(s.needs || s.currentNeeds || s.needs_json || s.needs || null),
          }
        })
        setAllStartups(mapped);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || 'Network error');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredStartups = allStartups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "all" || startup.sector === selectedSector;
    const matchesStage = selectedStage === "all" || startup.stage === selectedStage;
  // location filter now compares the selected country to startup.country
  const matchesLocation = selectedLocation === "all" || startup.country === selectedLocation;

    return matchesSearch && matchesSector && matchesStage && matchesLocation;
  });

  return (
    <>
      {loading && (
        <div className="text-center py-8">
          <p className="text-[#64748B]">Loading startups...</p>
        </div>
      )}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">Error : {error}</p>
        </div>
      )}
  {/* Séparateur visuel fin entre navbar et body */}
  <div className="w-full h-[2px] bg-gradient-to-r from-[#F18585]/40 via-[#EED5FB]/80 to-[#C174F2]/40 shadow-sm mb-2" />
  <div className="min-h-screen py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-[#C174F2] mb-2 tracking-tight font-montserrat">Startup Catalog</h1>
            <p className="text-lg text-[#64748B] font-open-sans">
              Discover <span className="font-bold text-[#F18585]">{allStartups.length}</span> innovative startups incubated at JEB
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-md shadow-lg rounded-2xl border-0 sticky top-8">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-[#C174F2]" />
                    <h3 className="font-semibold text-[#A259F7]">Filters</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block mb-2 text-[#A259F7] font-semibold">Research</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#C174F2]" />
                      <Input
                        placeholder="Name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/90 border-[#F18585] focus:border-[#C174F2] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Sector Filter */}
                  <div>
                    <label className="block mb-2 text-[#A259F7] font-semibold">Sector</label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                      <SelectTrigger className="bg-white/90 border-[#F18585] focus:border-[#C174F2] rounded-xl">
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sectors</SelectItem>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stage Filter */}
                  <div>
                    <label className="block mb-2 text-[#A259F7] font-semibold">Maturity stage</label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger className="bg-white/90 border-[#F18585] focus:border-[#C174F2] rounded-xl">
                        <SelectValue placeholder="All stadiums" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All stadiums</SelectItem>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block mb-2 text-[#A259F7] font-semibold">Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="bg-white/90 border-[#F18585] focus:border-[#C174F2] rounded-xl">
                        <SelectValue placeholder="All countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        {countries.map((country: string) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters */}
                  <Button 
                    variant="outline" 
                    className="w-full border-[#C174F2] text-[#C174F2] hover:bg-[#F18585]/10 hover:text-[#F18585] rounded-xl font-semibold"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSector("all");
                      setSelectedStage("all");
                      setSelectedLocation("all");
                    }}
                  >
                   Reset
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Startups Grid */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[#64748B] font-semibold">
                  {filteredStartups.length} startup{filteredStartups.length > 1 ? 's' : ''} found{filteredStartups.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredStartups.map((startup) => (
                  <Card 
                  key={startup.id} 
                  className="hover:shadow-2xl transition-shadow cursor-pointer bg-white/90 border-2 border-[#C174F2] rounded-2xl backdrop-blur-md"
                  onClick={() => onNavigate?.("startup-detail", startup)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        {startup.logo ? (
                          <ImageWithFallback
                            src={startup.logo}
                            alt={startup.name}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-[#C174F2]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#F3E8FF] border-2 border-[#C174F2]">
                            <ImageIcon className="h-6 w-6 text-[#C174F2]" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-[#C174F2]">{startup.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-[#A259F7]">
                            <MapPin className="h-3 w-3" />
                            <span>{startup.fullLocation || startup.location}</span>
                          </div>
                          {/* Sector and stage badges shown next to the name */}
                          <div className="flex items-center gap-2 mt-2">
                            {startup.sector && (
                              <Badge className="bg-[#F18585] text-white">{startup.sector}</Badge>
                            )}
                            {startup.stage && startup.stage !== 'Inconnu' && (
                              <Badge className="bg-[#C174F2] text-white">{startup.stage}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#64748B] mb-4">{startup.description}</p>
                      {/* badges moved to header to appear next to sector */}
                      <div className="text-sm text-[#64748B]">
                        <span className="font-medium text-[#F18585]">Current needs : </span>
                        {startup.currentNeeds && startup.currentNeeds.length ? startup.currentNeeds.join(", ") : <span className="text-[#94a3b8]">None</span>}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        className="w-full text-[#C174F2] border border-[#C174F2] hover:bg-[#F18585]/10 hover:text-[#F18585] rounded-xl font-semibold"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Prefer parent navigation handler if provided
                          if (onNavigate) {
                            onNavigate("startup-detail", startup);
                            return;
                          }
                          try { sessionStorage.setItem('selectedStartup', JSON.stringify(startup)); } catch {}
                          // Fire-and-forget: increment views in DB
                          try {
                            fetch(`/api/admin/startups/views?id=${encodeURIComponent(String(startup.id))}`, { method: 'POST' }).catch(()=>{});
                          } catch(_) {}
                          router.push('/ViewStartupProfile');
                        }}
                      >
                       View profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {filteredStartups.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No startups match your search criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-[#C174F2] text-[#C174F2] hover:bg-[#F18585]/10 hover:text-[#F18585] rounded-xl font-semibold"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSector("all");
                      setSelectedStage("all");
                      setSelectedLocation("all");
                    }}
                    >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  {/* Footer moved to _app.tsx */}
  </> 
  );
}

export default StartupsPage;