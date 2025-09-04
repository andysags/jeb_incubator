import { useState, useEffect } from "react";
import type { GetServerSideProps } from 'next';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  BarChart3,
  Users,
  Building2,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Search
} from "lucide-react";

interface NewsItem { id: number | string; title: string; status: string; date: string; views?: number }
interface EventItem { id: number | string; title: string; status: string; date: string; attendees?: number }

interface UserItem { id: number | string; name: string; email: string; role: string }
interface StartupItem { id: number | string; name: string; sector?: string; stage?: string; location?: string; logo?: string | null; status?: string; join_date?: string }
interface AdminDashboardProps {
  startups: number;
  investors: number;
  events: number;
  users: number;
  recentNews: NewsItem[];
  upcomingEvents: EventItem[];
  userList: UserItem[];
  startupList?: StartupItem[];
  startupsTotal?: number;
  startupsPage?: number;
  startupsLimit?: number;
}

export function AdminDashboard({ startups, investors, events, users, recentNews, upcomingEvents, userList, startupList, usersTotal: usersTotalProp = 0, usersPage: usersPageProp = 1, usersLimit: usersLimitProp = 10 }: AdminDashboardProps & { usersTotal?: number; usersPage?: number; usersLimit?: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  // Pagination utilisateurs
  const [usersPage, setUsersPage] = useState(usersPageProp)
  const [usersLimit] = useState(usersLimitProp)
  const [usersTotal, setUsersTotal] = useState(usersTotalProp)
  const [usersData, setUsersData] = useState<UserItem[]>(userList || [])
  const [usersLoading, setUsersLoading] = useState(false)
  // Stats filtrées selon les instructions client:
  // - Startups actives: nombre de startups (activité réelle gérée plus tard)
  // - Investisseurs: remplace Entrepreneurs
  // - Vues mensuelles: valeur statique
  // - Événements: nombre d'événements
  // Blocs supprimés: Messages échangés, Fonds levés, indicateurs d'évolution
  const stats = [
    { icon: Building2, label: "Startups", value: String(startups) },
    { icon: Users, label: "Investisseurs", value: String(investors) },
    { icon: Eye, label: "Utilisateurs", value: String(users) },
    { icon: Calendar, label: "Événements", value: String(events) }
  ];

  // startupList vient du serveur via SSR
  const startupRows = startupList || []
  // Pagination + tri pour startups
  const [startupsPage, setStartupsPage] = useState(1)
  const [startupsLimit] = useState(10)
  const [startupsTotal, setStartupsTotal] = useState(0)
  const [startupsData, setStartupsData] = useState<StartupItem[]>(startupList || [])
  const [startupsLoading, setStartupsLoading] = useState(false)
  const [orderBy, setOrderBy] = useState<'join_date'|'name'|'id'|'sector'|'stage'|'location'>('join_date')
  const [orderDir, setOrderDir] = useState<'asc'|'desc'>('desc')

  async function fetchStartupsPage(page: number) {
    setStartupsLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const resp = await fetch(`${baseUrl}/api/admin/startups?page=${page}&limit=${startupsLimit}&order_by=${orderBy}&order_dir=${orderDir}`)
      if (!resp.ok) throw new Error('status ' + resp.status)
      const json = await resp.json()
      setStartupsData(json.items || [])
      setStartupsTotal(json.total || 0)
      setStartupsPage(json.page || page)
    } catch (e) {
      console.warn('fetch startups page failed', e)
    } finally {
      setStartupsLoading(false)
    }
  }

  // Reload startups when pagination or sort changes
  useEffect(() => {
    fetchStartupsPage(startupsPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBy, orderDir, startupsPage])

  // Les tableaux recentNews & upcomingEvents viennent maintenant du serveur.
  // S'il n'y a rien, on n'affiche rien (pas de fallback factice).

  // startupRows is the SSR-initialized list; we use startupsData (paginated) for UI
  const filteredStartups = startupsData.filter((startup) => {
    const matchesSearch = (startup.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (startup.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
    // No status filtering
    return matchesSearch
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "graduated": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Actif";
      case "graduated": return "Diplômé";
      case "paused": return "En pause";
      default: return status;
    }
  };

  async function fetchUsersPage(page: number) {
    setUsersLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const resp = await fetch(`${baseUrl}/api/admin/users?page=${page}&limit=${usersLimit}`)
      if (!resp.ok) throw new Error('status ' + resp.status)
      const json = await resp.json()
      setUsersData(json.users || [])
      setUsersTotal(json.total || 0)
      setUsersPage(json.page || page)
    } catch (e) {
      console.warn('fetch users page failed', e)
    } finally {
      setUsersLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
    <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">Gérez la plateforme JEB et ses startups</p>
          </div>
          <div className="flex space-x-3">
      <Button variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
      <Button className="shadow-sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser API
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="startups">Startups</TabsTrigger>
            <TabsTrigger value="news">Actualités</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
        <Card key={index} className="bg-card text-card-foreground shadow-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="h-8 w-8 text-primary" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="font-medium text-gray-900">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card text-card-foreground shadow-card border-border">
                <CardHeader>
                  <h3 className="font-bold">Actualités récentes</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
        {recentNews.map((article) => (
                      <div key={article.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{article.title}</p>
                          <p className="text-xs text-gray-500">Publié le {article.date} {typeof article.views === 'number' && `• ${article.views} vues`}</p>
                        </div>
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {article.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4">
                    Gérer les actualités
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-card border-border">
                <CardHeader>
                  <h3 className="font-bold">Événements à venir</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
        {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
          <p className="text-xs text-gray-500">{event.date} {typeof event.attendees === 'number' && `• ${event.attendees} inscrits`}</p>
                        </div>
                        <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {event.status === 'confirmed' ? 'Confirmé' : 'Planification'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4">
                    Gérer les événements
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Startups Tab */}
          <TabsContent value="startups" className="space-y-6">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des startups</h3>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter startup
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher une startup..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("all")}
                    >
                      Toutes
                    </Button>
                    <Button
                      variant={selectedFilter === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("active")}
                    >
                      Actives
                    </Button>
                    <Button
                      variant={selectedFilter === "graduated" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter("graduated")}
                    >
                      Diplômées
                    </Button>
                  </div>
                </div>

                {/* Startups Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'name') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('name') }}>
                            <span>Startup</span>
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5-5 5 5H5z"/></svg>
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'sector') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('sector') }}>
                            <span>Secteur</span>
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5-5 5 5H5z"/></svg>
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'stage') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('stage') }}>
                            <span>Stade</span>
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5-5 5 5H5z"/></svg>
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'location') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('location') }}>
                            <span>Localisation</span>
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5-5 5 5H5z"/></svg>
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'join_date') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('join_date') }}>
                            <span>Date d&apos;entrée</span>
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5-5 5 5H5z"/></svg>
                          </button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStartups.map((startup) => (
                        <TableRow key={startup.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                                {startup.logo ? (
                                  <ImageWithFallback
                                    src={startup.logo}
                                    alt={startup.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <span className="font-medium">{startup.name}</span>
                              </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{startup.sector}</Badge>
                          </TableCell>
                          <TableCell>{startup.stage}</TableCell>
                          <TableCell>{startup.location}</TableCell>
                          <TableCell>{startup.join_date ? new Date(startup.join_date).toLocaleDateString('fr-FR') : 'Non renseigné'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end items-center mt-4 space-x-2">
                  <Button disabled={startupsPage <= 1 || startupsLoading} onClick={() => fetchStartupsPage(startupsPage - 1)} size="sm">Préc</Button>
                  <Button disabled={startupsPage * startupsLimit >= startupsTotal || startupsLoading} onClick={() => fetchStartupsPage(startupsPage + 1)} size="sm">Suiv</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des actualités</h3>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
      {recentNews.map((article) => (
                    <div key={article.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-gray-500">Publié le {article.date} {typeof article.views === 'number' && `• ${article.views} vues`}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                          {article.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des événements</h3>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel événement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
      {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-gray-500">{event.date} {typeof event.attendees === 'number' && `• ${event.attendees} inscrits`}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                          {event.status === 'confirmed' ? 'Confirmé' : 'Planification'}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <h3 className="font-bold">Liste des utilisateurs</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData && usersData.length > 0 ? usersData.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">{usersLoading ? 'Chargement...' : 'Aucun utilisateur'}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">Page {usersPage} — {usersTotal} utilisateurs</div>
                  <div className="flex space-x-2">
                    <Button disabled={usersPage <= 1 || usersLoading} onClick={() => fetchUsersPage(usersPage - 1)} size="sm">Préc</Button>
                    <Button disabled={usersPage * usersLimit >= usersTotal || usersLoading} onClick={() => fetchUsersPage(usersPage + 1)} size="sm">Suiv</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminDashboard;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;
  async function safeJson(path: string, fallback: any) {
    try {
      const resp = await fetch(`${baseUrl}${path}`)
      if (!resp.ok) throw new Error('status ' + resp.status)
      return await resp.json()
    } catch (e) {
      console.warn('SSR fetch fail', path, e)
      return fallback
    }
  }
  const [overview, news, eventsList, usersResp, startupsResp] = await Promise.all([
    safeJson('/api/admin/overview', { startups:0, investors:0, events:0, users:0 }),
    safeJson('/api/admin/recent-news', { items: [] }),
    safeJson('/api/admin/recent-events', { items: [] }),
    safeJson('/api/admin/users?page=1&limit=10', { users: [], total: 0, page: 1, limit: 10 }),
    safeJson('/api/admin/startups?limit=50', { items: [] })
  ])

  // Convert API structures to component props
  const recentNews = (news.items || []).map((n: any) => ({
    id: n.id,
    title: n.title,
    status: n.status || 'draft',
    date: n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : '',
    views: n.views
  }))
  const upcomingEvents = (eventsList.items || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    status: e.status || 'planning',
    date: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : '',
    attendees: e.attendees
  }))
  const userList = (usersResp.users || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  }))

  const startupList = (startupsResp.items || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    sector: s.sector,
    stage: s.stage,
    location: s.location,
    logo: s.logo,
    status: s.status,
    join_date: s.join_date
  }))

  // Passer aussi total/page/limit pour initialiser l'UI
  return { props: { ...overview, recentNews, upcomingEvents, userList, startupList, usersTotal: usersResp.total || 0, usersPage: usersResp.page || 1, usersLimit: usersResp.limit || 10 } }
}
