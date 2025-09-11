import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  User,
  Building2,
  Edit3,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Target,
  Send,
} from "lucide-react";

interface StartupDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export function StartupDashboard({ onNavigate }: StartupDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'success'|'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [profile, setProfile] = useState({
    name: "Nom de la startup",
    description: "",
    sector: "",
    stage: "",
    location: "",
    website: "",
    email: "",
    phone: "",
    teamSize: "",
  currentNeeds: [] as string[],
    logo: "",
  views: 0,
  });

  // compute percent change vs previous stored value
  const [viewsChangeLabel, setViewsChangeLabel] = useState<string>('new');
  const [viewsChangeClass, setViewsChangeClass] = useState<string>('text-blue-600');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const prevRaw = localStorage.getItem('jeb_profile_views_prev');
      const prev = prevRaw ? Number(prevRaw) : null;
      const curr = (profile as any).views != null ? Number((profile as any).views) : null;
      if (curr == null) {
        setViewsChangeLabel('new'); setViewsChangeClass('text-blue-600'); return;
      }
      if (prev === null || isNaN(prev)) {
        setViewsChangeLabel('new'); setViewsChangeClass('text-blue-600');
      } else {
        if (isNaN(curr)) { setViewsChangeLabel('new'); setViewsChangeClass('text-blue-600'); }
        else {
          const delta = curr - prev;
          const pct = prev === 0 ? (delta > 0 ? 100 : 0) : Math.round((delta / prev) * 100);
          const sign = pct > 0 ? `+${pct}%` : `${pct}%`;
          setViewsChangeLabel(sign);
          setViewsChangeClass(pct > 0 ? 'text-green-600' : (pct < 0 ? 'text-red-600' : 'text-gray-600'));
        }
      }
      // store current as previous for next render/session
      if (curr != null && !isNaN(curr)) localStorage.setItem('jeb_profile_views_prev', String(curr));
    } catch (e) {
      // ignore
    }
  }, [(profile as any).views]);

  // Load real profile from API (tries several possible endpoints)
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        if (!token) {
          const cached = typeof window !== 'undefined' ? localStorage.getItem('jeb_profile') : null;
          if (cached && mounted) setProfile(prev => ({ ...prev, ...JSON.parse(cached) }));
          return;
        }

        try {
          const res = await fetch('/api/me/startup', { headers: { Authorization: `Bearer ${token}` } })
          if (!res.ok) {
            let detail = ''
            try { const errJson = await res.json(); detail = errJson?.detail || errJson?.error || '' } catch {}
            if (res.status === 401) setProfileError('Non authentifié (token invalide ou expiré)' + (detail ? `: ${detail}` : ''));
            else if (res.status === 404) setProfileError('Aucune startup trouvée pour cet utilisateur' + (detail ? `: ${detail}` : ''));
            else setProfileError('Erreur de récupération du profil' + (detail ? `: ${detail}` : ''));
            return;
          }
          const src = await res.json().catch(() => null)
          if (!src) return
          const mapped = {
            name: src.name || profile.name,
            description: src.description || profile.description,
            sector: src.sector || profile.sector,
            stage: src.stage || profile.stage,
            location: src.location || profile.location,
            website: src.website_url || profile.website,
            email: src.email || profile.email,
            phone: src.phone || profile.phone,
            teamSize: src.team_size || profile.teamSize,
            views: (typeof src.views !== 'undefined' && src.views !== null) ? src.views : profile.views,
            currentNeeds: (Array.isArray(src.needs) ? src.needs : (typeof src.needs === 'string' && src.needs.trim().length ? src.needs.split(/[,;]+/).map((s:string)=>s.trim()).filter(Boolean) : profile.currentNeeds)),
            logo: src.logo || profile.logo || '/favicon.ico',
          } as any
          if (mounted) setProfile(prev => ({ ...prev, ...mapped }))
        } catch (e) {
          // ignore client fetch errors
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const stats = [
  { icon: TrendingUp, label: "Vues du profil", value: (profile as any).views != null ? String((profile as any).views) : "0", change: viewsChangeLabel, changeClass: viewsChangeClass },
    { icon: MessageSquare, label: "Messages", value: "15", change: "+3%" },
    { icon: Target, label: "Opportunités", value: "7", change: "new" }
  ];

  const recentMessages = [
    {
      id: 1,
      sender: "Marie Dubois",
      company: "InnovateCorp",
      subject: "Opportunité de partenariat",
      preview: "Bonjour, j'aimerais discuter d'une possible collaboration...",
      date: "Il y a 2h",
      unread: true
    },
    {
      id: 2,
      sender: "Thomas Martin",
      company: "TechVentures",
      subject: "Financement Série B",
      preview: "Nous sommes intéressés par votre projet et aimerions...",
      date: "Il y a 1 jour",
      unread: true
    },
    {
      id: 3,
      sender: "Sophie Bernard",
      company: "GreenFund",
      subject: "Invitation événement",
      preview: "Vous êtes invité à notre événement GreenTech du 25 février...",
      date: "Il y a 2 jours",
      unread: false
    }
  ];

  const opportunities = [
    {
      id: 1,
      title: "Partenariat avec EnergyFlow",
      type: "Partenariat",
      description: "Opportunité de collaboration pour le développement de solutions IoT",
      status: "new",
      date: "20 Jan 2025"
    },
    {
      id: 2,
      title: "Appel d'offres Ville de Paris",
      type: "Contrat",
      description: "Recherche de solutions d'optimisation énergétique pour bâtiments publics",
      status: "new",
      date: "18 Jan 2025"
    },
    {
      id: 3,
      title: "Financement EuropeAid",
      type: "Financement",
      description: "Programme de financement pour innovations durables",
      status: "ongoing",
      date: "15 Jan 2025"
    }
  ];

  const handleSave = async () => {
    setSaveStatus('saving'); setSaveMessage('');
    try {
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      if (!token) { setSaveStatus('error'); setSaveMessage('Pas de token'); return }
      const payload:any = {
        name: profile.name?.trim(),
        sector: profile.sector?.trim(),
        stage: profile.stage?.trim(),
        location: profile.location?.trim(),
        website_url: profile.website?.trim(),
        phone: profile.phone?.trim(),
        description: profile.description?.trim(),
      }
      if (profile.teamSize) payload.team_size = profile.teamSize
      if (profile.currentNeeds?.length) payload.needs = profile.currentNeeds
      const res = await fetch('/api/me/startup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        let detail=''; try { const j=await res.json(); detail=j.detail||j.error||'' } catch{}
        setSaveStatus('error'); setSaveMessage(detail || 'Echec de la sauvegarde'); return
      }
      setSaveStatus('success'); setSaveMessage('Enregistré');
      setIsEditing(false);
    } catch (e:any) {
      setSaveStatus('error'); setSaveMessage(e?.message||'Erreur inconnue')
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600">Gérez votre profil et suivez vos interactions</p>
          </div>
          {/* <Button 
            variant="outline"
            onClick={() => onNavigate?.("startup-detail", profile)}
          >
            Voir le profil public
          </Button> */}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-sm ${(stat as any).change === "new" ? "text-blue-600" : ((stat as any).changeClass || "text-green-600")}`}>
                                  {stat.change}
                                </p>
                      </div>
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            {/* <Card className="bg-white">
              <CardHeader>
                <h3 className="font-bold">Actions rapides</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Modifier le profil
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Nouveau message
                  </Button>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Voir les événements
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Messages récents</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMessages.slice(0, 3).map((message) => (
                      <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${message.unread ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-sm">{message.sender}</p>
                            <span className="text-xs text-gray-500">{message.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{message.subject}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{message.preview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4">
                    Voir tous les messages
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <h3 className="font-bold">Opportunités récentes</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {opportunities.slice(0, 3).map((opportunity) => (
                      <div key={opportunity.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{opportunity.title}</h4>
                          <Badge variant={opportunity.status === 'new' ? 'default' : 'secondary'} className="text-xs">
                            {opportunity.status === 'new' ? 'Nouveau' : 'En cours'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{opportunity.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">{opportunity.type}</Badge>
                          <span className="text-xs text-gray-500">{opportunity.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4">
                    Voir toutes les opportunités
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Profil de la startup</h3>
                  {!isEditing ? (
                    <Button onClick={() => { setIsEditing(true); setSaveStatus('idle'); setSaveMessage(''); }}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" disabled={saveStatus==='saving'} onClick={() => { setIsEditing(false); setSaveStatus('idle'); setSaveMessage(''); }}>
                        Annuler
                      </Button>
                      <Button disabled={saveStatus==='saving'} onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        {saveStatus==='saving' ? '...' : 'Sauvegarder'}
                      </Button>
                      {saveStatus==='success' && <span className="text-green-600 text-sm">{saveMessage}</span>}
                      {saveStatus==='error' && <span className="text-red-600 text-sm">{saveMessage}</span>}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingProfile && (
                  <p className="text-sm text-gray-500">Chargement du profil...</p>
                )}
                {profileError && !loadingProfile && (
                  <p className="text-sm text-red-600">{profileError}</p>
                )}
                {/* Logo et informations de base */}
                <div className="flex items-start space-x-6">
                  <ImageWithFallback
                    src={profile.logo}
                    alt={profile.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2">Nom de la startup</label>
                        {isEditing ? (
                          <Input
                            value={profile.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">{profile.name || '—'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block mb-2">Secteur</label>
                        {isEditing ? (
                          <Input
                            value={profile.sector}
                            onChange={(e) => handleEditChange('sector', e.target.value)}
                          />
                        ) : (
                          <Badge variant="secondary">{profile.sector || '—'}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-2">Description</label>
                  {isEditing ? (
                    <Textarea
                      value={profile.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-600">{profile.description || '—'}</p>
                  )}
                </div>

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Localisation
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.location}
                          onChange={(e) => handleEditChange('location', e.target.value)}
                        />
                      ) : (
                        <p>{profile.location || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2">
                        <Users className="inline h-4 w-4 mr-1" />
                        Taille de l'équipe
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.teamSize}
                          onChange={(e) => handleEditChange('teamSize', e.target.value)}
                        />
                      ) : (
                        <p>{profile.teamSize ? `${profile.teamSize} personnes` : '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2">Stade de développement</label>
                      {isEditing ? (
                        <Input
                          value={profile.stage}
                          onChange={(e) => handleEditChange('stage', e.target.value)}
                        />
                      ) : (
                        <Badge variant="outline">{profile.stage || '—'}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Site web
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.website}
                          onChange={(e) => handleEditChange('website', e.target.value)}
                        />
                      ) : (
                        profile.website ? (
                          <a href={profile.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            {profile.website}
                          </a>
                        ) : <p>—</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.email}
                          onChange={(e) => handleEditChange('email', e.target.value)}
                        />
                      ) : (
                        <p>{profile.email || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Téléphone
                      </label>
                      {isEditing ? (
                        <Input
                          value={profile.phone}
                          onChange={(e) => handleEditChange('phone', e.target.value)}
                        />
                      ) : (
                        <p>{profile.phone || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Besoins actuels */}
                <div>
                  <label className="block mb-2">Besoins actuels</label>
                  <div className="flex flex-wrap gap-2 min-h-6">
                    {profile.currentNeeds.length ? profile.currentNeeds.map((need, index) => (
                      <Badge key={index} variant="outline">{need}</Badge>
                    )) : <p className="text-gray-500 text-sm">—</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Messagerie</h3>
                  <Button>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Nouveau message
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${message.unread ? 'bg-primary' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className="font-medium">{message.sender}</p>
                            <p className="text-sm text-gray-600">{message.company}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{message.date}</span>
                      </div>
                      <h4 className="font-medium mb-1">{message.subject}</h4>
                      <p className="text-gray-600 text-sm">{message.preview}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card className="bg-white">
              <CardHeader>
                <h3 className="font-bold">Opportunités disponibles</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{opportunity.title}</h4>
                        <Badge variant={opportunity.status === 'new' ? 'default' : 'secondary'}>
                          {opportunity.status === 'new' ? 'Nouveau' : 'En cours'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{opportunity.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Badge variant="outline">{opportunity.type}</Badge>
                          <span className="text-sm text-gray-500">{opportunity.date}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          En savoir plus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Default export for Next.js page
export default function DashboardPage() {
  return <StartupDashboard />;
}
