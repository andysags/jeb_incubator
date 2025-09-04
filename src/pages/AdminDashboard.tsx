import { useState } from "react";
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

interface AdminDashboardProps {
  startups: number;
  investors: number;
  events: number;
  users: number;
  recentNews: NewsItem[];
  upcomingEvents: EventItem[];
}

export function AdminDashboard({ startups, investors, events, users, recentNews, upcomingEvents }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
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

  const startupRows = [
    {
      id: 1,
      name: "EcoTech Solutions",
      sector: "GreenTech",
      stage: "Série A",
      location: "Paris",
      joinDate: "Mars 2023",
      status: "active",
      logo: "https://images.unsplash.com/photo-1609619385076-36a873425636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 2,
      name: "HealthAI",
      sector: "HealthTech",
      stage: "Seed",
      location: "Lyon",
      joinDate: "Juin 2023",
      status: "active",
      logo: "https://images.unsplash.com/photo-1707301280425-475534ec3cc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzU2NjU3NzkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 3,
      name: "FinFlow",
      sector: "FinTech",
      stage: "Pré-seed",
      location: "Marseille",
      joinDate: "Sept 2023",
      status: "active",
      logo: "https://images.unsplash.com/photo-1732284081090-8880f1e1905b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 4,
      name: "AgriBot",
      sector: "AgriTech",
      stage: "Série A",
      location: "Toulouse",
      joinDate: "Jan 2023",
      status: "graduated",
      logo: "https://images.unsplash.com/photo-1609619385076-36a873425636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 5,
      name: "EduVR",
      sector: "EdTech",
      stage: "Seed",
      location: "Paris",
      joinDate: "Nov 2023",
      status: "active",
      logo: "https://images.unsplash.com/photo-1707301280425-475534ec3cc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzU2NjU3NzkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  // Les tableaux recentNews & upcomingEvents viennent maintenant du serveur.
  // S'il n'y a rien, on n'affiche rien (pas de fallback factice).

  const filteredStartups = startupRows.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || startup.status === selectedFilter;
    return matchesSearch && matchesFilter;
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
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                        <TableHead>Startup</TableHead>
                        <TableHead>Secteur</TableHead>
                        <TableHead>Stade</TableHead>
                        <TableHead>Localisation</TableHead>
                        <TableHead>Date d&apos;entrée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStartups.map((startup) => (
                        <TableRow key={startup.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <ImageWithFallback
                                src={startup.logo}
                                alt={startup.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <span className="font-medium">{startup.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{startup.sector}</Badge>
                          </TableCell>
                          <TableCell>{startup.stage}</TableCell>
                          <TableCell>{startup.location}</TableCell>
                          <TableCell>{startup.joinDate}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(startup.status)}>
                              {getStatusLabel(startup.status)}
                            </Badge>
                          </TableCell>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card text-card-foreground shadow-card border-border">
                <CardHeader>
                  <h3 className="font-bold">Visites mensuelles</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Graphique des visites mensuelles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-card border-border">
                <CardHeader>
                  <h3 className="font-bold">Secteurs les plus populaires</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>GreenTech</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>HealthTech</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: '72%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">72%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>FinTech</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: '68%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">68%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>EdTech</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: '54%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">54%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
  const [overview, news, eventsList] = await Promise.all([
    safeJson('/api/admin/overview', { startups:0, investors:0, events:0, users:0 }),
    safeJson('/api/admin/recent-news', { items: [] }),
    safeJson('/api/admin/recent-events', { items: [] })
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

  return { props: { ...overview, recentNews, upcomingEvents } }
}
