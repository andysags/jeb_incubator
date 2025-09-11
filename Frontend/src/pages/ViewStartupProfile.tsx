import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
// Header and Footer are rendered globally in _app.tsx
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ArrowLeft, MapPin, Calendar, Globe, Mail, Phone, Linkedin, Twitter, Send } from "lucide-react";

interface StartupDetailPageProps {
  startup?: any;
  onNavigate?: (page: string, data?: any) => void;
}

export function StartupDetailPage({ startup, onNavigate }: StartupDetailPageProps) {
  const router = useRouter();
  const [startupData, setStartupData] = useState<any>(startup || null);
  const [loading, setLoading] = useState<boolean>(!startup);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Priority: query param ?id=123 -> fetch API, else sessionStorage fallback
    let mounted = true;
    const queryId = typeof router.query.id === 'string' ? router.query.id : (router.query.id ? String(router.query.id) : null);
    if (startup) {
      setLoading(false);
      return;
    }

    const loadFromSession = () => {
      try {
        const savedStartup = sessionStorage.getItem('selectedStartup');
        if (savedStartup) setStartupData(JSON.parse(savedStartup));
      } catch (e) {
        console.warn('Failed to parse session selectedStartup', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (queryId) {
      setLoading(true);
      setError(null);
      fetch(`/api/admin/startups?id=${encodeURIComponent(queryId)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (!mounted) return;
          // API may return { items: [...] } or an object
          const item = Array.isArray(data) ? data[0] : (data.items && data.items[0]) || data;
          setStartupData(item || null);
        })
        .catch((err) => {
          console.error('Failed to load startup by id', err);
          if (!mounted) return;
          setError(err.message || 'Failed to load startup');
          // fallback to sessionStorage
          loadFromSession();
        })
        .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
    }

    // no id: use sessionStorage
    loadFromSession();
    return () => { mounted = false; };
  }, []);

  const currentStartup = startupData || startup || null;

  // Consolidated refetch effect: when we have (or get) an id but lack long description,
  // fetch the canonical startup row once. This effect is declared in a stable place
  // and depends only on the canonical id string to avoid hook-order instability.
  const canonicalId = currentStartup?.id || currentStartup?.startup_id || currentStartup?.pk || null;

  React.useEffect(() => {
    if (!canonicalId) return;
    // If we already have a DB long description, skip refetch
    if (currentStartup?.description_longue || currentStartup?.long_description) return;

    let mounted = true;
    fetch(`/api/admin/startups?id=${encodeURIComponent(String(canonicalId))}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const item = Array.isArray(data) ? data[0] : (data && (data.items && data.items[0])) || data;
        if (item) setStartupData(item);
      })
      .catch((e) => {
        console.warn('Could not fetch full startup row:', e?.message || e);
      });
    return () => { mounted = false; };
  }, [String(canonicalId)]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading startup profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Erreur</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="mt-6">
              <Button onClick={() => router.push('/startups')}>Retour au catalogue</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleBackToStartups = () => {
    if (onNavigate) {
      onNavigate("startups");
    } else {
      router.push('/startups');
    }
  };

  // Prefer a long description column if present
  // Normalize fields using the French column names provided
  const normalized = {
    id: currentStartup.id,
    name: currentStartup.nom || currentStartup.name || currentStartup.company_name || currentStartup.name_fr || currentStartup.name_en,
    logo: currentStartup.logo_url || currentStartup.logo || currentStartup.logoUrl || currentStartup.image || '',
    description_longue: currentStartup.description_longue || currentStartup.description_long || currentStartup.long_description || currentStartup.description || '',
    secteur: currentStartup.secteur || currentStartup.sector || currentStartup.industry || '',
    stade: currentStartup.stade || currentStartup.stage || currentStartup.maturity || '',
    localisation: currentStartup.localisation || currentStartup.location || currentStartup.address || currentStartup.fullLocation || '',
    date_creation: currentStartup.date_creation || currentStartup.date_incub || currentStartup.dateIncub || null,
    nb_pers: currentStartup.nb_pers || currentStartup.team_size || currentStartup.nb_personnes || null,
    chiffre_aff: currentStartup.chiffre_aff || currentStartup.revenue || currentStartup.chiffre_affaires || null,
    site_web: currentStartup.site_web || currentStartup.website_url || currentStartup.website || '',
    contact_email: currentStartup.contact_email || currentStartup.email || currentStartup.contact_email_address || '',
    contact_tel: currentStartup.contact_tel || currentStartup.contact_tel || currentStartup.phone || '',
    reseaux_sociaux: currentStartup.reseaux_sociaux || currentStartup.social_media || currentStartup.socials || null,
    needs: currentStartup.needs || currentStartup.currentNeeds || currentStartup.besoins || []
  };

  const longDesc = normalized.description_longue || '';
  const fullDescription = longDesc || (currentStartup.description || '');

  const keyInfo = [
    { label: "Business Sector", value: normalized.secteur },
    { label: "Maturity Stage", value: normalized.stade },
    { label: "Location", value: normalized.localisation },
    { label: "Incubation Date", value: normalized.date_creation || "March 2023" },
    { label: "Team", value: normalized.nb_pers || "15 people" },
    { label: "Revenue", value: normalized.chiffre_aff || "€250K" }
  ];

  const socialLinks = [
    { icon: Globe, label: "Website", url: normalized.site_web || '' },
  ];

  const contactInfo = [
    { icon: Mail, label: "Email", value: normalized.contact_email || '' },
    { icon: Phone, label: "Phone", value: normalized.contact_tel || '' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={handleBackToStartups}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-start space-x-6">
                    <ImageWithFallback
                      src={normalized.logo}
                      alt={normalized.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">{normalized.name}</h1>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="secondary" className="text-sm">{normalized.secteur}</Badge>
                        <Badge variant="outline" className="text-sm">{normalized.stade}</Badge>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{normalized.localisation}</span>
                        </div>
                      </div>
                      {/* <p className="text-xl text-gray-600">{normalized.description_longue || currentStartup.description}</p> */}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Description détaillée */}
              <Card className="bg-white">
                <CardHeader>
                  <h2 className="text-2xl font-bold">About</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {fullDescription ? (
                      fullDescription.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="mb-4 text-gray-600 leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      ))
                    ) : (
                      <div className="text-gray-500 italic">
                        <p>Aucune description détaillée disponible.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Besoins actuels */}
              <Card className="bg-white">
                <CardHeader>
                  <h2 className="text-2xl font-bold">Current Needs</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(normalized.needs) ? normalized.needs : (currentStartup.currentNeeds || [])).map((need: string, index: number) => (
                      <div key={index} className="flex items-center p-4 bg-primary/5 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        <span className="font-medium">{need}</span>
                      </div>
                    ))}
                  </div>
                  {/* <div className="mt-6">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Send className="mr-2 h-4 w-4" />
                      Propose Collaboration
                    </Button>
                  </div> */}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Informations clés */}
              <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Key Information</h3>
                </CardHeader>
                <CardContent>
                      <div className="space-y-4">
                    {keyInfo.map((info, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{info.label}</span>
                        <span className="font-medium">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Contact</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contactInfo.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <contact.icon className="h-4 w-4 text-primary" />
                        <span className="text-gray-600">{contact.value}</span>
                      </div>
                    ))}
                  </div>
                  {normalized.contact_email ? (
                    <a href={`mailto:${encodeURIComponent(normalized.contact_email)}`} className="w-full block mt-4">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    </a>
                  ) : (
                    <Button disabled className="w-full mt-4 bg-gray-200 text-gray-500 cursor-not-allowed">
                      <Mail className="mr-2 h-4 w-4" />
                      Pas d'email disponible
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Liens sociaux */}
              <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Links</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-600 hover:text-primary transition-colors"
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              {/* <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Timeline</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Jan 2025</span>
                        </div>
                        <p className="font-medium">Series A Funding Round</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-px h-8 bg-gray-200"></div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Mar 2023</span>
                        </div>
                        <p className="font-medium">JEB Integration</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Jan 2022</span>
                        </div>
                        <p className="font-medium">Company Foundation</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
      
  {/* Footer rendered globally in _app.tsx */}
    </div>
  );
}

export default StartupDetailPage;