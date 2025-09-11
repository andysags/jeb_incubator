import React, { useState } from 'react';
// Header rendered by parent container (index.jsx) to avoid duplication
// Footer rendered globally in _app.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Video,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import usePersonalizedNavigation from '../hooks/usePersonalizedNavigation';


interface EventsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date?: string;
  time?: string;
  // date/time may be undefined when source doesn't provide them
  // (stored as ISO date string 'YYYY-MM-DD' and time 'HH:MM')

  location?: string;
  type?: 'workshop' | 'demo-day' | 'networking' | 'conference' | 'webinar' | string;
  attendees?: number;
  maxAttendees?: number;
  isOnline: boolean;
  organizer?: string;
  tags: string[];
  registrationUrl?: string;
  price?: string;
}

export default function EventsPage({ onNavigate }: EventsPageProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Try multiple possible backend endpoints and return first successful array
  async function fetchEventsFromBackend() {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
    // prefer the local Next.js admin API first (it is authoritative in this repo)
    const candidates = [
      '/api/admin/events', // local Next.js API route - most reliable
      `${base}/api/evenements/`,
      `${base}/api/events/`,
      `${base}/api/v1/events/`,
      `${base}/events/`,
    ];
    for (const url of candidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        // data could be { items: [...] } or an array or { results: [...] }
        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.items)) arr = data.items;
        else if (Array.isArray(data.results)) arr = data.results;
  if (!arr.length) continue;
  // debug: indicate which source provided events
  try { console.debug('[EventsPage] fetched', arr.length, 'events from', url) } catch (e) { }

        // Normalize each item: map known fields, use undefined when missing
        const mapped: Event[] = arr.map((it: any, idx: number) => {
          const id = it.id ?? it.pk ?? (it._id ?? idx)
          const title = it.title ?? it.titre ?? undefined
          const description = it.description ?? it.desc ?? it.description_fr ?? undefined

          // pick raw datetime candidate
          const rawDateTime = it.start_datetime ?? it.date ?? it.start ?? (it.date_debut ?? undefined)
          let dateStr: string | undefined = undefined
          let timeStr: string | undefined = undefined
          if (rawDateTime) {
            try {
              // if it's a JSON string like '"2025-09-22"' or ['2025-09-22']
              let dt = rawDateTime
              if (typeof dt === 'string' && dt.startsWith('"') && dt.endsWith('"')) {
                dt = dt.slice(1, -1)
              }
              if (Array.isArray(dt)) dt = dt[0]
              // try to create Date
              const parsed = new Date(dt)
              if (!isNaN(parsed.getTime())) {
                dateStr = parsed.toISOString().slice(0,10)
                // use locale time of the parsed date (HH:MM)
                timeStr = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              } else {
                // fallback: if string in YYYY-MM-DD format
                const s = String(dt)
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) dateStr = s
              }
            } catch (e) {
              /* ignore */
            }
          }

          const evt: Event = {
            id,
            title,
            description,
            date: dateStr ?? undefined,
            time: timeStr ?? (it.time ?? it.start_time ?? undefined),
            location: it.location ?? it.lieu ?? undefined,
            type: (it.type || it.event_type || it.eventType || it.type_event) ?? undefined,
            attendees: typeof it.attendees !== 'undefined' ? Number(it.attendees) : (typeof it.nb_inscrits !== 'undefined' ? Number(it.nb_inscrits) : undefined),
            maxAttendees: (typeof it.maxAttendees !== 'undefined' ? Number(it.maxAttendees) : (typeof it.max_attendees !== 'undefined' ? Number(it.max_attendees) : (typeof it.capacity !== 'undefined' ? Number(it.capacity) : (typeof it.max_capacity !== 'undefined' ? Number(it.max_capacity) : (typeof it.nb_max !== 'undefined' ? Number(it.nb_max) : undefined))))),
            isOnline: typeof it.isOnline !== 'undefined' ? Boolean(it.isOnline) : (String(it.location || '').toLowerCase().includes('online') || String(it.location || '').toLowerCase() === 'online'),
            organizer: it.organizer ?? it.organisateur ?? undefined,
            tags: Array.isArray(it.tags) ? it.tags : (typeof it.tags === 'string' && it.tags.length ? it.tags.split(/[,;]+/).map((s:string)=>s.trim()).filter(Boolean) : []),
            registrationUrl: it.registrationUrl ?? it.registration_url ?? it.url ?? undefined,
            price: it.price ?? it.cost ?? undefined
          }
          return evt
        })

        return mapped;
      } catch (e) {
        // try next candidate
        continue;
      }
    }
    return [];
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const list = await fetchEventsFromBackend();
      if (mounted) setEvents(list as Event[]);
      setLoading(false);
    })();
    return () => { mounted = false };
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'demo-day': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'networking': return 'bg-green-100 text-green-800';
      case 'conference': return 'bg-orange-100 text-orange-800';
      case 'webinar': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demo-day': return 'Demo Day';
      case 'workshop': return 'Workshop';
      case 'networking': return 'Networking';
      case 'conference': return 'Conférence';
      case 'webinar': return 'Webinaire';
      default: return type;
    }
  };

  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'all') return true;
    return event.type === selectedFilter;
  });

  const sortedEvents = filteredEvents.sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY
    const tb = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY
    return ta - tb
  });

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = (typeof dateString === 'string' || typeof dateString === 'number') ? new Date(dateString) : dateString;
      if (!(date instanceof Date) || isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) { return '' }
  };

  const formatShortDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = (typeof dateString === 'string' || typeof dateString === 'number') ? new Date(dateString) : dateString;
      if (!(date instanceof Date) || isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
      });
    } catch (e) { return '' }
  };

  // Génération du calendrier mensuel simplifié
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // helper: normalize event date to YYYY-MM-DD
    const toISODate = (d?: string | number | Date) => {
      if (!d) return undefined;
      try {
        const date = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
        if (!(date instanceof Date) || isNaN(date.getTime())) return undefined;
        return date.toISOString().split('T')[0];
      } catch (e) { return undefined }
    };

    // group events by ISO date for quick lookup
    const eventsByDate: Record<string, Event[]> = {};
    events.forEach(ev => {
      const iso = toISODate(ev.date);
      if (!iso) return;
      eventsByDate[iso] = eventsByDate[iso] || [];
      eventsByDate[iso].push(ev);
    });

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const fullDate = prevDate.toISOString().split('T')[0];
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        fullDate,
        events: eventsByDate[fullDate] || []
      });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day).toISOString().split('T')[0];
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate,
        events: eventsByDate[fullDate] || [],
        hasEvents: (eventsByDate[fullDate] || []).length > 0
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="bg-white hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <Badge className={getTypeColor(event.type || '')}>
              {getTypeLabel(event.type || '')}
            </Badge>
            {event.isOnline && (
              <Badge variant="outline" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
          </div>
          <div className="text-right">
              <div className="font-semibold text-primary">
              {formatShortDate(event.date || '')}
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <p className="text-sm text-gray-600">{event.organizer}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(event.date || '')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          {event.attendees !== undefined && event.maxAttendees !== undefined && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{event.attendees}/{event.maxAttendees} participants</span>
            </div>
          )}
          {event.maxAttendees !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Places prévues: <strong className="text-gray-700">{event.maxAttendees}</strong></span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
  <div className="pt-2" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Events Calendar</h1>
          <p className="text-xl text-gray-600">
            Discover all the events in the startup ecosystem
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All events
            </Button>
            <Button
              variant={selectedFilter === 'workshop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('workshop')}
            >
              Workshops
            </Button>
            <Button
              variant={selectedFilter === 'demo-day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('demo-day')}
            >
              Demo Days
            </Button>
            <Button
              variant={selectedFilter === 'networking' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('networking')}
            >
              Networking
            </Button>
            <Button
              variant={selectedFilter === 'conference' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('conference')}
            >
              Conferences
            </Button>
            <Button
              variant={selectedFilter === 'webinar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('webinar')}
            >
              Webinars
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List view</TabsTrigger>
            <TabsTrigger value="calendar">Calendar view</TabsTrigger>
          </TabsList>

          {/* List view */}
          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>

          {/* Calendar view */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xl">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => (
                    <div
                      key={index}
                      className={`p-2 min-h-[4rem] border rounded text-sm overflow-hidden ${
                        day.isCurrentMonth 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-gray-50 text-gray-400'
                      } ${day.hasEvents ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium">{day.date}</div>
                        {day.events && day.events.length > 0 && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                        )}
                      </div>

                      {/* events preview: up to 3 */}
                      {day.events && day.events.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {day.events.slice(0, 3).map((ev) => (
                            <div key={ev.id} className="flex items-center space-x-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${getTypeColor(ev.type || '').split(' ')[0].replace('bg-','bg-')}`} />
                              <span className="text-xs truncate" title={ev.title}>{ev.title}</span>
                            </div>
                          ))}
                          {day.events.length > 3 && (
                            <div className="text-xs text-gray-500">+{day.events.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming events */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Upcoming events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedEvents.slice(0, 4).map((event) => (
                  <Card key={event.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={getTypeColor(event.type || '')} >
                          {getTypeLabel(event.type || '')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatShortDate(event.date || '')}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{event.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{event.time}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.location}
                      </div>
                      {event.maxAttendees !== undefined && (
                        <div className="text-xs text-gray-500 mt-2">Places prévues: <strong className="text-gray-700">{event.maxAttendees}</strong></div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  {/* Footer moved to _app.tsx */}
    </div>
  );
}
