import React, { useState, useEffect, useRef } from "react";
import type { GetServerSideProps } from 'next';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {Header} from "../components/Header"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";
import { useRouter } from 'next/router';

import { 
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
interface EventItem { id: number | string; title: string; status: string; date: string; attendees?: number; event_type?: string }

interface UserItem { id: number | string; name: string; email: string; role: string }
interface StartupItem { id: number | string; name: string; sector?: string; stage?: string; location?: string; logo?: string | null; status?: string; join_date?: string; legal_status?: string }
interface AdminDashboardProps {
  startups: number;
  investors: number;
  events: number;
  users: number;
  recentNews: NewsItem[];
  allNews?: NewsItem[];
  upcomingEvents: EventItem[];
  userList: UserItem[];
  startupList?: StartupItem[];
  startupsTotal?: number;
  startupsPage?: number;
  startupsLimit?: number;
  allNewsTotal?: number;
}

export function AdminDashboard({ startups, investors, events, users, recentNews, allNews, allNewsTotal, upcomingEvents, userList, startupList, usersTotal: usersTotalProp = 0, usersPage: usersPageProp = 1, usersLimit: usersLimitProp = 10 }: AdminDashboardProps & { usersTotal?: number; usersPage?: number; usersLimit?: number }) {
  console.log('[AdminDashboard] SSR recentNews:', recentNews);
  console.log('[AdminDashboard] SSR allNews:', allNews);
  const router = useRouter();
  const { userProfile } = usePersonalizedNavigation();

  // Guard: check localStorage token and userType directly to avoid race with personalized hook
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const userType = localStorage.getItem('userType');
      if (!token) {
        // not authenticated -> send to login
        router.replace('/login');
        return;
      }
      if (userType !== 'admin') {
        // authenticated but not admin -> send to home
        router.replace('/');
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingStartup, setEditingStartup] = useState<StartupItem | null>(null);
  const [viewStartupId, setViewStartupId] = useState<string|number|null>(null);
  const [viewData, setViewData] = useState<any|null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string|undefined>();
  const [deleteTarget, setDeleteTarget] = useState<StartupItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string|undefined>();
  const legalStatuses = ["SAS","GMBh","SPA","OY","BV","LTD","As","SARL","kft"];
  const stagesList = ["Idea","Prototype","MVP","Product-Market Fit","Growth","Scale-up"];
  const [form, setForm] = useState({
    name: "",
    description: "",
    sector: "",
    stage: "",
    website_url: "",
    social_media_url: "",
    email: "",
    phone: "",
    location: "",
    legal_status: "",
    needs: "",
    logoFile: null as File | null,
  });
  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(f => ({ ...f, [k]: v })); }
  const [createError, setCreateError] = useState<string|undefined>();
  // News modal state
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsCreating, setNewsCreating] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number|string|null>(null);
  const [flashMessage, setFlashMessage] = useState<string|undefined>(undefined);

  // small utility to show a transient message
  function showFlash(msg: string, ms = 2000) {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(undefined), ms);
  }
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageFile: null as File | null, imagePreview: null as string | null, draft: true });
  function updateNews<K extends keyof typeof newsForm>(k: K, v: (typeof newsForm)[K]) { setNewsForm(f => ({ ...f, [k]: v })); }
  const currentImageObjectUrl = useRef<string|null>(null);
  function revokeCurrentObjectUrl() {
    if (currentImageObjectUrl.current) {
      try { URL.revokeObjectURL(currentImageObjectUrl.current); } catch(e){}
      currentImageObjectUrl.current = null;
    }
  }
  function handleNewsFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    // revoke previous object url
    revokeCurrentObjectUrl();
    if (file) {
      const obj = URL.createObjectURL(file);
      currentImageObjectUrl.current = obj;
      setNewsForm(f => ({ ...f, imageFile: file, imagePreview: obj }));
    } else {
      setNewsForm(f => ({ ...f, imageFile: null, imagePreview: null }));
    }
  }
  useEffect(()=>{
    return () => { revokeCurrentObjectUrl(); }
  },[])
  useEffect(()=>{
    if (!newsOpen) revokeCurrentObjectUrl();
  },[newsOpen])
  const [newsDeleteId, setNewsDeleteId] = useState<string|null>(null);
  const [viewNewsId, setViewNewsId] = useState<string|null>(null);
  const [viewNewsData, setViewNewsData] = useState<any|null>(null);
  // Events modal state
  const [eventOpen, setEventOpen] = useState(false);
  const [eventCreating, setEventCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number|string|null>(null);
  const [eventDeleteId, setEventDeleteId] = useState<number|string|null>(null);
  const [viewEventId, setViewEventId] = useState<number|string|null>(null);
  const [viewEventData, setViewEventData] = useState<any|null>(null);
  const [viewEventLoading, setViewEventLoading] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', start_datetime: '', end_datetime: '', location: '', attendees: 0, imageFile: null as File | null, imagePreview: null as string | null, event_type: 'Pitch Session', target_audience: '' });
  function updateEvent<K extends keyof typeof eventForm>(k: K, v: (typeof eventForm)[K]) { setEventForm(f => ({ ...f, [k]: v })); }
  const currentEventImageObjectUrl = useRef<string|null>(null);
  function revokeCurrentEventObjectUrl() { if (currentEventImageObjectUrl.current) { try { URL.revokeObjectURL(currentEventImageObjectUrl.current); } catch(e){} currentEventImageObjectUrl.current = null; } }
  function handleEventFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    revokeCurrentEventObjectUrl();
    if (file) {
      const obj = URL.createObjectURL(file);
      currentEventImageObjectUrl.current = obj;
      setEventForm(f => ({ ...f, imageFile: file, imagePreview: obj }));
    } else {
      setEventForm(f => ({ ...f, imageFile: null, imagePreview: null }));
    }
  }
  useEffect(() => { return () => { revokeCurrentEventObjectUrl(); } }, []);
  useEffect(() => { if (!eventOpen) revokeCurrentEventObjectUrl(); }, [eventOpen]);
  // News list pagination (for the full management view)
  const [newsPage, setNewsPage] = useState(1);
  const [newsLimit] = useState(20);
  const [newsTotal, setNewsTotal] = useState(0);
  const [newsData, setNewsData] = useState<NewsItem[]>(allNews || []);
  const [newsLoading, setNewsLoading] = useState(false);
  async function fetchNewsPage(page: number) {
    setNewsLoading(true);
    try {
    const baseUrl = (typeof window !== 'undefined') ? '' : (process.env.NEXT_PUBLIC_BASE_URL || '');
      const resp = await fetch(`${baseUrl}/api/admin/recent-news?limit=${newsLimit}&page=${page}`);
      if (!resp.ok) throw new Error('status ' + resp.status);
      const json = await resp.json();
      // json.items expected, json.total optional
      const items = (json.items || []).map((n: any) => ({ id: n.id, title: n.title, status: n.status, date: n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : '', views: n.views }));
      setNewsData(items);
      setNewsTotal(json.total || (json.items ? (Array.isArray(json.items) ? json.items.length : 0) : 0));
      setNewsPage(json.page || page);
    } catch (e) {
      console.warn('fetchNewsPage failed', e);
    } finally {
      setNewsLoading(false);
    }
  }

  // Events pagination / list (for management view)
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLimit] = useState(20);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsData, setEventsData] = useState<EventItem[]>(upcomingEvents || []);
  const [eventsLoading, setEventsLoading] = useState(false);

  async function fetchEventsPage(page: number) {
    setEventsLoading(true);
    try {
  const baseUrl = (typeof window !== 'undefined') ? '' : (process.env.NEXT_PUBLIC_BASE_URL || '');
      const resp = await fetch(`${baseUrl}/api/admin/recent-events?limit=${eventsLimit}&page=${page}`);
      if (!resp.ok) throw new Error('status ' + resp.status);
      const json = await resp.json();
  const items = (json.items || []).map((e: any) => ({ id: e.id, title: e.title, status: e.status || 'planning', date: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : '', attendees: e.attendees, event_type: e.event_type }));
      setEventsData(items);
      setEventsTotal(json.total || (json.items ? (Array.isArray(json.items) ? json.items.length : 0) : 0));
      setEventsPage(json.page || page);
    } catch (e) {
      console.warn('fetchEventsPage failed', e);
    } finally { setEventsLoading(false); }
  }

  async function fetchEventDetails(id: number|string) {
    try {
  const baseUrl = (typeof window !== 'undefined') ? '' : (process.env.NEXT_PUBLIC_BASE_URL || '');
      console.log('[fetchEventDetails] requesting id=', id);
      const r = await fetch(`${baseUrl}/api/admin/events?id=${id}`);
      if (!r.ok) {
        const text = await r.text().catch(()=>null);
        console.warn('[fetchEventDetails] non-ok response', r.status, text);
        throw new Error('http '+r.status + (text ? ' - '+text : ''));
      }
      const json = await r.json();
      console.log('[fetchEventDetails] got', json);
      return json;
    } catch (e) { console.warn('fetchEventDetails failed', e); return null; }
  }

  useEffect(() => {
  // Always fetch page 1 from the API to ensure the management view is sourced from the paginated endpoint
  fetchNewsPage(1);
  // also fetch events page 1 to ensure we have up-to-date event_type values for badges
  fetchEventsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  async function fileToDataURL(file: File): Promise<string> { return new Promise((resolve, reject)=>{ const fr = new FileReader(); fr.onerror=()=>reject(fr.error); fr.onload=()=>resolve(String(fr.result)); fr.readAsDataURL(file); }); }
  // Pagination utilisateurs
  const [usersPage, setUsersPage] = useState(usersPageProp)
  const [usersLimit] = useState(usersLimitProp)
  const [usersTotal, setUsersTotal] = useState(usersTotalProp)
  const [usersData, setUsersData] = useState<UserItem[]>(userList || [])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '' });
  const [userDeleteId, setUserDeleteId] = useState<number|string|null>(null);
  const [userDeleting, setUserDeleting] = useState(false);
  const [userDeleteError, setUserDeleteError] = useState<string|undefined>(undefined);
  function updateUserForm<K extends keyof typeof userForm>(k: K, v: (typeof userForm)[K]) { setUserForm(f => ({ ...f, [k]: v })); }
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
  // Pagination + tri pour startups
  const [startupsPage, setStartupsPage] = useState(1)
  const [startupsLimit] = useState(10)
  const [startupsTotal, setStartupsTotal] = useState(0)
  const [startupsData, setStartupsData] = useState<StartupItem[]>(startupList || [])
  const [startupsLoading, setStartupsLoading] = useState(false)
  const [orderBy, setOrderBy] = useState<'join_date'|'name'|'id'|'sector'|'stage'|'location'|'legal_status'>('name')
  const [orderDir, setOrderDir] = useState<'asc'|'desc'>('desc')
  const [stage, setStage] = useState<string>('')

  async function fetchStartupsPage(page: number) {
    setStartupsLoading(true)
    try {
  const baseUrl = (typeof window !== 'undefined') ? '' : (process.env.NEXT_PUBLIC_BASE_URL || '')
  const params = new URLSearchParams({ page: String(page), limit: String(startupsLimit), order_by: orderBy, order_dir: orderDir })
  if (stage) params.set('stage', stage)
  const resp = await fetch(`${baseUrl}/api/admin/startups?${params.toString()}`)
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
  }, [orderBy, orderDir, startupsPage, stage])

  // Les tableaux recentNews & upcomingEvents viennent maintenant du serveur.
  // S'il n'y a rien, on n'affiche rien (pas de fallback factice).

  // startupRows is the SSR-initialized list; we use startupsData (paginated) for UI
  const filteredStartups = startupsData.filter((startup) => {
    const matchesSearch = (startup.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (startup.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
    // No status filtering
    return matchesSearch
  });


  async function fetchUsersPage(page: number) {
    setUsersLoading(true)
    try {
  const baseUrl = (typeof window !== 'undefined') ? '' : (process.env.NEXT_PUBLIC_BASE_URL || '')
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

  // Early-return after hooks declared to avoid hooks ordering errors
  // if (!checkedAuth) return null;
  // if (authorized === false) return null;

  return (
    <div className="min-h-screen py-8 bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <Dialog open={createOpen} onOpenChange={o => { if(!creating) { if(!o) { setEditingStartup(null); } setCreateOpen(o); } }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingStartup ? 'Modifier la startup' : 'Créer une startup'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={async e => { 
              e.preventDefault(); 
              if (creating) return; 
              setCreating(true); 
              setCreateError(undefined);
              try {
                let logo_base64: string | undefined = undefined;
                if (form.logoFile) logo_base64 = await fileToDataURL(form.logoFile);
                const payload = {
                  name: form.name,
                  description: form.description,
                  sector: form.sector,
                  stage: form.stage,
                  location: form.location,
                  website_url: form.website_url,
                  social_media_url: form.social_media_url,
                  email: form.email,
                  phone: form.phone,
                  legal_status: form.legal_status,
                  needs: form.needs,
                  logo_base64
                }
                const resp = await fetch(editingStartup ? `/api/admin/startups?id=${editingStartup.id}` : '/api/admin/startups', { 
                  method: editingStartup ? 'PUT' : 'POST', 
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                  const t = await resp.json().catch(()=>({}));
                  throw new Error(t?.detail || t?.error || ('HTTP '+resp.status));
                }
                // reset & close
                setForm({ name:"", description:"", sector:"", stage:"", website_url:"", social_media_url:"", email:"", phone:"", location:"", legal_status:"", needs:"", logoFile:null });
                setCreateOpen(false);
                setEditingStartup(null);
                // refresh startups page 1
                fetchStartupsPage(1);
              } catch (err) {
                console.warn('create failed', err);
                setCreateError((err as Error).message || 'Erreur inconnue');
              } finally { setCreating(false); }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input required value={form.name} onChange={e=>update('name', e.target.value)} placeholder="Nom de la startup" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Secteur *</label>
                  <Input required value={form.sector} onChange={e=>update('sector', e.target.value)} placeholder="Ex: FinTech" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Stade *</label>
                  <Select value={form.stage} onValueChange={v=>update('stage', v)}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {stagesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Statut légal *</label>
                  <Select value={form.legal_status} onValueChange={v=>update('legal_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {legalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex flex-col space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={4} value={form.description} onChange={e=>update('description', e.target.value)} placeholder="Courte description" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Site web</label>
                  <Input type="url" value={form.website_url} onChange={e=>update('website_url', e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Réseaux sociaux</label>
                  <Input type="url" value={form.social_media_url} onChange={e=>update('social_media_url', e.target.value)} placeholder="https://linkedin.com/..." />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email} onChange={e=>update('email', e.target.value)} placeholder="contact@startup.io" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input value={form.phone} onChange={e=>update('phone', e.target.value)} placeholder="+33..." />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Localisation</label>
                  <Input value={form.location} onChange={e=>update('location', e.target.value)} placeholder="Adresse, Code Postal Pays" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Besoins</label>
                  <Textarea rows={2} value={form.needs} onChange={e=>update('needs', e.target.value)} placeholder="Séparez par des virgules (ex: Talent, Mentorat)" />
                </div>
                <div className="flex flex-col space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Logo / Photo</label>
                  <Input type="file" accept="image/*" onChange={e=>update('logoFile', e.target.files?.[0] || null)} />
                  {form.logoFile && <p className="text-xs text-muted-foreground">{form.logoFile.name} ({Math.round(form.logoFile.size/1024)} Ko)</p>}
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                {createError && <p className="text-sm text-red-500 mr-auto">{createError}</p>}
                <Button type="button" variant="outline" onClick={()=>!creating && setCreateOpen(false)}>Annuler</Button>
                <Button disabled={creating || !form.name || !form.sector || !form.stage || !form.legal_status}>{creating ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Delete confirmation for news */}
        <Dialog open={!!newsDeleteId} onOpenChange={o => { if (!o) setNewsDeleteId(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer l'actualité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm">Êtes-vous sûr de vouloir supprimer cette actualité ? Cette action est irréversible.</p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={()=> setNewsDeleteId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={async () => {
                if (!newsDeleteId) return;
                try {
                  const r = await fetch(`/api/admin/news?id=${newsDeleteId}`, { method: 'DELETE' });
                  if (!r.ok) {
                    const t = await r.json().catch(()=>({}));
                    throw new Error(t?.detail || t?.error || ('HTTP '+r.status));
                  }
                  setNewsDeleteId(null);
                  window.location.reload();
                } catch (err) { console.warn('delete news failed', err); alert('Erreur suppression'); }
              }}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={o => { if(!o && !deleting) { setDeleteTarget(null); setDeleteError(undefined); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer la startup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm">Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteTarget?.name}</span> ? Cette action est irréversible.</p>
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" disabled={deleting} onClick={()=>!deleting && setDeleteTarget(null)}>Annuler</Button>
              <Button variant="destructive" disabled={deleting} onClick={async ()=>{
                if(!deleteTarget) return;
                setDeleting(true); setDeleteError(undefined);
                try {
                  const r = await fetch(`/api/admin/startups?id=${deleteTarget.id}`, { method:'DELETE' })
                  if(!r.ok) {
                    const t = await r.json().catch(()=>({}));
                    throw new Error(t?.detail || t?.error || 'Suppression échouée');
                  }
                  setDeleteTarget(null);
                  fetchStartupsPage(1);
                } catch(e:any){ setDeleteError(e.message || 'Erreur inconnue'); }
                finally { setDeleting(false); }
              }}>{deleting ? 'Suppression...' : 'Supprimer'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* View Startup Dialog */}
        <Dialog open={viewStartupId !== null} onOpenChange={o => { if(!o) { setViewStartupId(null); setViewData(null); setViewError(undefined); } }}>
          <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Détails de la startup</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {viewLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
              {viewError && <p className="text-sm text-red-500">{viewError}</p>}
              {viewData && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="w-28 h-28 rounded border flex items-center justify-center bg-white overflow-hidden">
                      {viewData.logo ? <img src={viewData.logo} alt={viewData.name} className="object-cover w-full h-full" /> : <Building2 className="h-10 w-10 text-gray-400" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h2 className="text-2xl font-semibold">{viewData.name}</h2>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {viewData.sector && <Badge variant="secondary">{viewData.sector}</Badge>}
                        {viewData.stage && <Badge variant="secondary">{viewData.stage}</Badge>}
                        {viewData.legal_status && <Badge variant="outline">{viewData.legal_status}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{viewData.location || 'Localisation non renseignée'}</p>
                      {viewData.join_date && <p className="text-xs text-gray-500">Date d'entrée: {new Date(viewData.join_date).toLocaleDateString('fr-FR')}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-gray-500">Contact</h3>
                      <ul className="text-sm space-y-1">
                        <li><span className="font-semibold">Email:</span> {viewData.email || <span className="text-muted-foreground">—</span>}</li>
                        <li><span className="font-semibold">Téléphone:</span> {viewData.phone || <span className="text-muted-foreground">—</span>}</li>
                        <li><span className="font-semibold">Site web:</span> {viewData.website_url ? <a className="text-primary underline" href={viewData.website_url} target="_blank" rel="noreferrer">{viewData.website_url}</a> : <span className="text-muted-foreground">—</span>}</li>
                        <li><span className="font-semibold">Réseaux:</span> {viewData.social_media_url ? <a className="text-primary underline" href={viewData.social_media_url} target="_blank" rel="noreferrer">Lien</a> : <span className="text-muted-foreground">—</span>}</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-gray-500">Besoins</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewData.needs) ? viewData.needs : (typeof viewData.needs === 'string' ? viewData.needs.split(/[,;]+/).map((n:string)=>n.trim()).filter(Boolean) : [])).map((n:string)=>(<Badge key={n} variant="outline">{n}</Badge>))}
                        {(!viewData.needs || (Array.isArray(viewData.needs) && !viewData.needs.length)) && <span className="text-xs text-muted-foreground">Aucun besoin renseigné</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm uppercase tracking-wide text-gray-500">Fondateurs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewData.founders && viewData.founders.length ? viewData.founders.map((f:any)=>(
                        <div key={f.id} className="p-3 border rounded-lg flex flex-col gap-1 bg-muted/30">
                          <p className="font-medium text-sm">{f.name || 'Sans nom'}</p>
                          <p className="text-xs text-muted-foreground">{f.role || 'Rôle inconnu'}</p>
                          {f.email && <p className="text-xs">{f.email}</p>}
                        </div>
                      )): <p className="text-xs text-muted-foreground">Aucun fondateur</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=> setViewStartupId(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Header */}
    <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">Gérez la plateforme JEB et ses startups</p>
          </div>
          <div className="flex space-x-3">
      <Button className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
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
                        <div className="flex items-center space-x-3">
                          <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                            {article.status === 'published' ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </div>
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
        {(eventsData && eventsData.length ? eventsData : upcomingEvents).map((event) => (
                      <div key={event.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
          <p className="text-xs text-gray-500">{event.date} {typeof event.attendees === 'number' && `• ${event.attendees} inscrits`}</p>
                        </div>
                        {/* <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {event.event_type ? event.event_type : (event.status === 'confirmed' ? 'Confirmé' : 'Planification')}
                        </Badge> */}
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

          {/* Event Create Modal */}
          <Dialog open={eventOpen} onOpenChange={o => { if(!eventCreating) { if(!o) setEventForm({ title:'', description:'', start_datetime:'', end_datetime:'', location:'', attendees:0, imageFile:null, imagePreview:null, event_type: 'Pitch Session', target_audience: '' }); setEventOpen(o); } }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEventId ? 'Modifier l\'événement' : 'Nouvel événement'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={async e => {
                e.preventDefault();
                if (eventCreating) return;
                setEventCreating(true);
                try {
                  let image_base64: string | undefined = undefined;
                  if (eventForm.imageFile) {
                    const fr = new FileReader();
                    image_base64 = await new Promise<string>((res, rej) => { fr.onload = ()=>res(String(fr.result)); fr.onerror = ()=>rej(fr.error); fr.readAsDataURL(eventForm.imageFile as File); });
                  }
                  const payload = {
                    title: eventForm.title,
                    description: eventForm.description,
                    start_datetime: eventForm.start_datetime,
                    end_datetime: eventForm.end_datetime || null,
                    location: eventForm.location,
                    attendees: eventForm.attendees,
                    image_base64,
                    event_type: eventForm.event_type,
                    target_audience: eventForm.target_audience,
                  };
                  const url = editingEventId ? `/api/admin/events?id=${editingEventId}` : '/api/admin/events';
                  const method = editingEventId ? 'PUT' : 'POST';
                  const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!resp.ok) {
                    const t = await resp.json().catch(()=>({}));
                    throw new Error(t?.detail || t?.error || ('HTTP '+resp.status));
                  }
                  setEventOpen(false);
                  setEventForm({ title:'', description:'', start_datetime:'', end_datetime:'', location:'', attendees:0, imageFile:null, imagePreview:null, event_type: 'Pitch Session', target_audience: '' });
                  setEditingEventId(null);
                  // refresh events list
                  fetchEventsPage(1);
                } catch (err:any) {
                  console.warn('create event failed', err);
                  alert(err.message || 'Erreur création événement');
                } finally { setEventCreating(false); }
              }} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input required value={eventForm.title} onChange={e=>updateEvent('title', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={4} value={eventForm.description} onChange={e=>updateEvent('description', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Date et heure de début *</label>
                    <Input type="datetime-local" required value={eventForm.start_datetime} onChange={e=>updateEvent('start_datetime', e.target.value)} />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Date et heure de fin</label>
                    <Input type="datetime-local" value={eventForm.end_datetime} onChange={e=>updateEvent('end_datetime', e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Lieu</label>
                  <Input value={eventForm.location} onChange={e=>updateEvent('location', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Participants attendus</label>
                  <Input type="number" min={0} value={String(eventForm.attendees || '')} onChange={e=>updateEvent('attendees', Number(e.target.value || 0))} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Photo (optionnelle)</label>
                  {eventForm.imagePreview && (
                    <div className="mb-2"><img src={eventForm.imagePreview as string} alt="Aperçu" className="max-h-40 object-contain rounded border" /></div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleEventFileChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={eventForm.event_type} onValueChange={v=>updateEvent('event_type', v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Pitch Session','Conference','Workshop','Hackathon','Networking'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Cible</label>
                    <Input value={eventForm.target_audience} onChange={e=>updateEvent('target_audience', e.target.value)} placeholder="Ex: Startups, Investors, Developers" />
                  </div>
                </div>
                <DialogFooter className="sm:justify-between">
                  <Button type="button" variant="outline" onClick={()=>!eventCreating && setEventOpen(false)}>Annuler</Button>
                  <Button disabled={eventCreating || !eventForm.title || !eventForm.start_datetime}>{eventCreating ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Event Confirmation */}
          <Dialog open={!!eventDeleteId} onOpenChange={o => { if(!o) setEventDeleteId(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Supprimer l'événement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm">Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.</p>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="outline" onClick={()=> setEventDeleteId(null)}>Annuler</Button>
                <Button variant="destructive" onClick={async () => {
                  if (!eventDeleteId) return;
                  try {
                    const r = await fetch(`/api/admin/events?id=${eventDeleteId}`, { method: 'DELETE' });
                    if (!r.ok) {
                      const t = await r.json().catch(()=>({}));
                      throw new Error(t?.detail || t?.error || ('HTTP '+r.status));
                    }
                    setEventDeleteId(null);
                    fetchEventsPage(1);
                  } catch (err) { console.warn('delete event failed', err); alert('Erreur suppression événement'); }
                }}>Supprimer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Event Dialog (read-only) */}
          <Dialog open={!!viewEventId} onOpenChange={o => { if(!o) { setViewEventId(null); setViewEventData(null); setViewEventLoading(false); } }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewEventData ? (viewEventData.title || 'Événement') : 'Événement'}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {viewEventLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
                {viewEventData && (
                  <div className="space-y-4">
                    {viewEventData.image && <div className="w-full flex justify-center"><img src={viewEventData.image} alt={viewEventData.title} className="max-h-64 object-contain rounded" /></div>}
                    <p className="text-sm"><strong>Date de début:</strong> {viewEventData.start_datetime ? new Date(viewEventData.start_datetime).toLocaleString('fr-FR') : '—'}</p>
                    <p className="text-sm"><strong>Lieu:</strong> {viewEventData.location || '—'}</p>
                    <p className="text-sm"><strong>Participants attendus:</strong> {viewEventData.attendees ?? '—'}</p>
                    <p className="text-sm"><strong>Type:</strong> {viewEventData.event_type || '—'}</p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewEventData.description || '' }} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setViewEventId(null); setViewEventData(null); }}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Startups Tab */}
          <TabsContent value="startups" className="space-y-6">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des startups</h3>
                  <Button onClick={() => { setEditingStartup(null); setForm({ name:"", description:"", sector:"", stage:"", website_url:"", social_media_url:"", email:"", phone:"", location:"", legal_status:"", needs:"", logoFile:null }); setCreateOpen(true); }}>
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
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-600 mr-2">Par stade:</span>
                    <Button size="sm" variant={stage === '' ? 'default' : 'outline'} onClick={() => setStage('')}>Tous</Button>
                    <Button size="sm" variant={stage === 'MVP' ? 'default' : 'outline'} onClick={() => setStage('MVP')}>MVP</Button>
                    <Button size="sm" variant={stage === 'prototype' ? 'default' : 'outline'} onClick={() => setStage('prototype')}>Prototype</Button>
                    <Button size="sm" variant={stage === 'Product-Market Fit' ? 'default' : 'outline'} onClick={() => setStage('Product-Market Fit')}>PMF</Button>
                    <Button size="sm" variant={stage === 'idea' ? 'default' : 'outline'} onClick={() => setStage('idea')}>Idée</Button>
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
                          <button className="flex items-center space-x-2" onClick={() => { if (orderBy === 'legal_status') setOrderDir(orderDir === 'asc' ? 'desc' : 'asc'); setOrderBy('legal_status') }}>
                            <span>Statut légal</span>
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
                          <TableCell>{startup.legal_status || 'Non renseigné'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" onClick={async () => {
                                setViewStartupId(startup.id);
                                setViewData(null); setViewError(undefined); setViewLoading(true);
                                try {
                                  const r = await fetch(`/api/admin/startups?id=${startup.id}`)
                                  if(!r.ok) throw new Error('Chargement détail échoué')
                                  const d = await r.json()
                                  setViewData(d)
                                } catch(e:any){ setViewError(e.message); }
                                finally { setViewLoading(false); }
                              }}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingStartup(startup);
                                setForm({
                                  name: startup.name || '',
                                  description: '',
                                  sector: startup.sector || '',
                                  stage: startup.stage || '',
                                  website_url: '',
                                  social_media_url: '',
                                  email: '',
                                  phone: '',
                                  location: startup.location || '',
                                  legal_status: (startup as any).legal_status || '',
                                  needs: '',
                                  logoFile: null
                                });
                                setCreateOpen(true);
                              }}>
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(startup)}>
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
                <div className="flex justify-end items-center mt-4 space-x-2">
                  <Button disabled={newsPage <= 1 || newsLoading} onClick={async () => { const p = Math.max(1, newsPage - 1); await fetchNewsPage(p); }} size="sm">Préc</Button>
                  <Button disabled={newsPage * newsLimit >= newsTotal || newsLoading} onClick={async () => { const p = newsPage + 1; await fetchNewsPage(p); }} size="sm">Suiv</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Edit Modal */}
          <Dialog open={userEditOpen} onOpenChange={o => { if(!o) { setUserEditOpen(false); setEditingUser(null); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Modifier l\'utilisateur' : 'Modifier l\'utilisateur'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editingUser) return;
                try {
                  const payload = { name: userForm.name, email: userForm.email, role: userForm.role };
                  const r = await fetch(`/api/admin/users?id=${editingUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!r.ok) {
                    const t = await r.json().catch(()=>({}));
                    throw new Error(t?.detail || t?.error || ('HTTP '+r.status));
                  }
                  setUserEditOpen(false);
                  setEditingUser(null);
                  fetchUsersPage(1);
                } catch (err:any) { console.warn('update user failed', err); alert('Erreur mise à jour'); }
              }} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input required value={userForm.name} onChange={e=>updateUserForm('name', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input required type="email" value={userForm.email} onChange={e=>updateUserForm('email', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Rôle</label>
                  <Select value={userForm.role} onValueChange={v=>updateUserForm('role', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="privileged_visitors">Privileged visitors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=> { setUserEditOpen(false); setEditingUser(null); }}>Annuler</Button>
                  <Button type="submit">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* User Delete Confirmation */}
          <Dialog open={!!userDeleteId} onOpenChange={o => { if(!o) setUserDeleteId(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Supprimer l'utilisateur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm">Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
                {userDeleteError && <p className="text-sm text-red-500">{userDeleteError}</p>}
              </div>
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="outline" disabled={userDeleting} onClick={()=> setUserDeleteId(null)}>Annuler</Button>
                <Button variant="destructive" disabled={userDeleting} onClick={async () => {
                  if (!userDeleteId) return;
                  setUserDeleting(true); setUserDeleteError(undefined);
                  try {
                    const r = await fetch(`/api/admin/users?id=${userDeleteId}`, { method: 'DELETE' });
                    if (!r.ok) {
                      const t = await r.json().catch(()=>({}));
                      throw new Error(t?.detail || t?.error || ('HTTP '+r.status));
                    }
                    setUserDeleteId(null);
                    fetchUsersPage(1);
                  } catch (e:any) { setUserDeleteError(e.message || 'Erreur suppression'); }
                  finally { setUserDeleting(false); }
                }}>Supprimer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* News Tab */}
          <TabsContent value="news">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des actualités</h3>
                  <Button onClick={() => { setEditingNewsId(null); revokeCurrentObjectUrl(); setNewsForm({ title:'', content:'', imageFile:null, imagePreview:null, draft:true }); setNewsOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
  {newsData.map((article) => (
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
                          <Button size="sm" variant="ghost" onClick={async () => {
                            // open read-only view modal
                            try {
                              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
                              const r = await fetch(`${baseUrl}/api/admin/news?id=${article.id}`)
                              if (!r.ok) throw new Error('failed to load article')
                              const data = await r.json()
                              setViewNewsId(String(article.id));
                              setViewNewsData({
                                title: data.title || article.title,
                                content: data.content || data.contenu || data.body || '',
                                image: data.image_url || data.image || data.image_base64 || null,
                              });
                            } catch (err) {
                              console.warn('failed to fetch article for view', err);
                              setViewNewsId(String(article.id));
                              setViewNewsData({ title: article.title, content: '' });
                            }
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
              <Button size="sm" variant="ghost" onClick={async (e) => {
                            e.stopPropagation();
                            // open edit modal, fetch content first
                            try {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
                const r = await fetch(`${baseUrl}/api/admin/news?id=${article.id}`)
                              if (!r.ok) throw new Error('failed to load article')
                              const data = await r.json()
                              setEditingNewsId(article.id);
                              const imgPreview2 = data.image_url || data.image || data.image_base64 || null;
                              const contentVal2 = data.content || data.contenu || data.body || '';
                              setNewsForm({ title: String(data.title || article.title), content: String(contentVal2), imageFile: null, imagePreview: imgPreview2, draft: data.publie_le ? (new Date(data.publie_le) > new Date()) : (article.status !== 'published') });
                              setNewsOpen(true);
                            } catch (err) {
                              console.warn('failed to fetch article content', err);
                              setEditingNewsId(article.id);
                              revokeCurrentObjectUrl();
                              setNewsForm({ title: String(article.title), content: '', imageFile: null, imagePreview: null, draft: article.status !== 'published' });
                              setNewsOpen(true);
                            }
                          }}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setNewsDeleteId(String(article.id)); }}>
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

          {/* News Create Modal */}
          <Dialog open={newsOpen} onOpenChange={o => { if(!newsCreating) { if(!o) setNewsForm({ title:'', content:'', imageFile:null, imagePreview:null, draft:true }); setNewsOpen(o); } }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNewsId ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={async e => {
                e.preventDefault();
                if (newsCreating) return;
                setNewsCreating(true); setCreateError(undefined);
                try {
                  let image_base64: string | undefined = undefined;
                  if (newsForm.imageFile) {
                    const fr = new FileReader();
                    image_base64 = await new Promise<string>((res, rej) => { fr.onload = ()=>res(String(fr.result)); fr.onerror = ()=>rej(fr.error); fr.readAsDataURL(newsForm.imageFile as File); });
                  }
                  const payload = { title: newsForm.title, content: newsForm.content, image_base64, draft: newsForm.draft };
                  const url = editingNewsId ? `/api/admin/news?id=${editingNewsId}` : '/api/admin/news'
                  const method = editingNewsId ? 'PUT' : 'POST'
                  const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!resp.ok) {
                    let t = {} as any;
                    try {
                      t = await resp.clone().json();
                    } catch(e1) {
                      try {
                        const txt = await resp.clone().text();
                        t = { error: txt };
                      } catch(e2) {
                        t = { error: 'failed to read response body' };
                      }
                    }
                    throw new Error(t?.detail || t?.error || ('HTTP '+resp.status));
                  }
                  setNewsOpen(false);
                  setNewsForm({ title:'', content:'', imageFile:null, imagePreview:null, draft:true });
                  setEditingNewsId(null);
                  window.location.reload();
                } catch (err:any) {
                  setCreateError(err.message || 'Erreur');
                } finally { setNewsCreating(false); }
              }} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input required value={newsForm.title} onChange={e=>updateNews('title', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Contenu *</label>
                  <Textarea required rows={6} value={newsForm.content} onChange={e=>updateNews('content', e.target.value)} />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Image (optionnelle)</label>
                  {newsForm.imagePreview && (
                    <div className="mb-2">
                      <img src={newsForm.imagePreview} alt="Aperçu" className="max-h-40 object-contain rounded border" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleNewsFileChange} />
                </div>
                <div className="flex items-center space-x-2">
                  <input id="draft" type="checkbox" checked={newsForm.draft} onChange={e=>updateNews('draft', e.target.checked)} />
                  <label htmlFor="draft" className="text-sm">Enregistrer en brouillon</label>
                </div>
                <DialogFooter className="sm:justify-between">
                  {createError && <p className="text-sm text-red-500 mr-auto">{createError}</p>}
                  <Button type="button" variant="outline" onClick={()=>!newsCreating && setNewsOpen(false)}>Annuler</Button>
                  <Button disabled={newsCreating || (!editingNewsId && (!newsForm.title || !newsForm.content))}>{newsCreating ? 'Enregistrement...' : 'Enregistrer'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Read-only News View Dialog */}
          <Dialog open={!!viewNewsId} onOpenChange={o => { if (!o) { setViewNewsId(null); setViewNewsData(null); } }}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{viewNewsData ? (viewNewsData.title || 'Actualité') : 'Actualité'}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {viewNewsData?.image && (
                  <div className="w-full flex justify-center">
                    <img src={viewNewsData.image} alt={viewNewsData.title} className="max-h-64 object-contain rounded" />
                  </div>
                )}
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: viewNewsData?.content || '' }} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setViewNewsId(null); setViewNewsData(null); }}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-card text-card-foreground shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Gestion des événements</h3>
                      <Button onClick={() => { setEditingEventId(null); revokeCurrentEventObjectUrl(); setEventForm({ title:'', description:'', start_datetime:'', end_datetime:'', location:'', attendees:0, imageFile:null, imagePreview:null, event_type: 'Pitch Session', target_audience: '' }); setEventOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvel événement
                      </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
      {(eventsData && eventsData.length ? eventsData : upcomingEvents).map((event) => (
                    <div key={event.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-gray-500">{event.date} {typeof event.attendees === 'number' && `• ${event.attendees} inscrits`}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {event.event_type && (
                          <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {event.event_type}
                          </Badge>
                        )}
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" onClick={async () => {
                            // View (read-only) – fetch details and open view dialog
                            setViewEventId(event.id as any);
                            setViewEventLoading(true);
                            try {
                              const d = await fetchEventDetails(event.id as number);
                              if (!d) throw new Error('not found');
                              setViewEventData(d);
                            } catch (e) {
                              console.warn('view event failed', e);
                              alert('Impossible de charger les détails de l\'événement');
                            } finally { setViewEventLoading(false); }
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            // Edit: fetch details then open modal
                            
                            const d = await fetchEventDetails(event.id as number);
                            if (d) {
                              setEditingEventId(event.id as any);
                              revokeCurrentEventObjectUrl();
                              setEventForm({ title: d.title || '', description: d.description || '', start_datetime: d.start_datetime || '', end_datetime: d.end_datetime || '', location: d.location || '', attendees: Number(d.attendees || 0), imageFile: null, imagePreview: d.image || null, event_type: d.event_type || 'Pitch Session', target_audience: d.target_audience || '' });
                              setEventOpen(true);
                            } else {
                              alert('Impossible de charger les détails de l\'événement');
                            }
                          }}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEventDeleteId(event.id as any); }}>
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
                                <Button size="sm" variant="ghost" onClick={async () => {
                                  // open edit modal
                                  setEditingUser(user);
                                  setUserForm({ name: user.name || '', email: user.email || '', role: user.role || '' });
                                  setUserEditOpen(true);
                                }}>
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setUserDeleteId(user.id); }}>
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
  {/* Footer moved to _app.tsx */}
    </div>
  );
}

export default AdminDashboard;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // During server-side rendering we want internal Next API routes (relative paths).
  // Always use the relative path to call Next's built-in API handlers. If you need
  // to call an external backend during SSR, introduce a separate env flag.
  async function safeJson(path: string, fallback: unknown) {
    try {
      // Build absolute URL using request host so fetch works in Node SSR environment
      const protocol = req.headers['x-forwarded-proto'] || 'http'
      const host = req.headers['host']
      const base = `${protocol}://${host}`
      const url = new URL(path, base).toString()
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('status ' + resp.status)
      return await resp.json()
    } catch (e) {
      console.warn('SSR fetch fail', path, e)
      return fallback
    }
  }
  const [overview, recentResp, allResp, eventsList, usersResp, startupsResp] = await Promise.all([
    safeJson('/api/admin/overview', { startups:0, investors:0, events:0, users:0 }),
  // overview: 3 most recent articles
  safeJson('/api/admin/recent-news?limit=3', { items: [] }),
  // allResp: fetch all news (no limit) for the full management list
  safeJson('/api/admin/recent-news', { items: [], total: 0, page: 1 }),
    safeJson('/api/admin/recent-events', { items: [] }),
    safeJson('/api/admin/users?page=1&limit=10', { users: [], total: 0, page: 1, limit: 10 }),
    safeJson('/api/admin/startups?limit=50', { items: [] })
  ])

  // Convert API structures to component props
  const recentNews = (recentResp.items || []).map((n: { id: string | number; title: string; status?: string; created_at?: string; views?: number }) => ({
    id: n.id,
    title: n.title,
    status: n.status,
    date: n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : '',
    views: n.views
  }))
  const allNews = (allResp.items || []).map((n: { id: string | number; title: string; status?: string; created_at?: string; views?: number }) => ({
    id: n.id,
    title: n.title,
    status: n.status,
    date: n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : '',
    views: n.views
  }))
  const allNewsTotal = (allResp.total != null) ? allResp.total : (allNews.length || 0)
  const upcomingEvents = (eventsList.items || []).map((e: { id: string | number; title: string; status?: string; created_at?: string; attendees?: number; event_type?: string }) => ({
    id: e.id,
    title: e.title,
    status: e.status || 'planning',
  date: e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR') : '',
    attendees: e.attendees, 
  event_type: e.event_type ?? null
  }))
  const userList = (usersResp.users || []).map((u: { id: string | number; name: string; email: string; role: string }) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  }))

  const startupList = (startupsResp.items || []).map((s: { id: string | number; name: string; sector?: string; stage?: string; location?: string; logo?: string; status?: string; join_date?: string; legal_status?: string|null }) => ({
    id: s.id,
    name: s.name,
    sector: s.sector,
    stage: s.stage,
    location: s.location,
    logo: s.logo,
    status: s.status,
  join_date: s.join_date,
  legal_status: s.legal_status === undefined ? null : s.legal_status
  }))

  // Passer aussi total/page/limit pour initialiser l'UI
  return { props: { ...overview, recentNews, allNews, allNewsTotal, upcomingEvents, userList, startupList, usersTotal: usersResp.total || 0, usersPage: usersResp.page || 1, usersLimit: usersResp.limit || 10 } }
}
