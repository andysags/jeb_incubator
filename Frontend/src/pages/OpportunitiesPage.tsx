import { useState } from "react";
// Header and Footer are rendered globally in _app.tsx
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Search, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Euro,
  FileText,
  Users,
  Mail,
  Phone,
  Globe,
  Filter
} from "lucide-react";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";

interface OpportunitiesPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

interface Opportunity {
  id: number;
  title: string;
  description: string;
  organization: string;
  type: string;
  deadline?: string;
  budget?: string;
  location?: string;
  tags: string[];
  status: "open" | "closing-soon" | "closed";
  url?: string;
}

interface Contact {
  id: number;
  name: string;
  position: string;
  organization: string;
  expertise: string[];
  email: string;
  phone?: string;
  website?: string;
  avatar: string;
}

export function OpportunitiesPage({ onNavigate }: OpportunitiesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const projectCalls: Opportunity[] = [
    {
      id: 1,
      title: "GreenTech Innovation Call for Projects",
      description: "Looking for innovative solutions for the ecological transition. Grant up to €500k for large-scale cleantech projects.",
      organization: "Île-de-France Region",
      type: "Grant",
      deadline: "March 15, 2025",
      budget: "€500k",
      location: "Île-de-France",
      tags: ["GreenTech", "Innovation", "Environment"],
      status: "open",
      url: "https://exemple.fr/appel-greentech"
},
    {
      id: 2,
      title: "Deep Tech Acceleration Program",
      description: "6-month intensive support for deep tech startups with funding and mentoring. Focus on AI, robotics, and biotech.",
      organization: "Bpifrance",
      type: "Acceleration",
      deadline: "February 28, 2025",
      budget: "€200k",
      location: "National",
      tags: ["Deep Tech", "AI", "Robotics"],
      status: "closing-soon",
      url: "https://exemple.fr/deep-tech"
},
    {
      id: 3,
      title: "Smart City Challenge",
      description: "International competition for smart urban solutions. €100k prize and pilot deployment opportunity.",
      organization: "City of Paris",
      type: "Competition",
      deadline: "April 10, 2025",
      budget: "€100k",
      location: "Paris",
      tags: ["Smart City", "Urban Tech", "IoT"],
      status: "open"
    }
  ];

  const funding: Opportunity[] = [
    {
      id: 4,
      title: "Impact Investment Fund",
      description: "Funding for startups with social and environmental impact. Tickets from €50k to €2M with strategic support.",
      organization: "Impact Partners",
      type: "Investment",
      budget: "€50k - €2M",
      location: "France",
      tags: ["Impact", "ESG", "Social"],
      status: "open"
    },
    {
      id: 5,
      title: "France 2030 Program - Digital",
      description: "Support for sovereign digital innovations. Public funding for strategic projects up to €5M.",
      organization: "France 2030",
      type: "Public Funding",
      deadline: "May 31, 2025",
      budget: "€5M",
      location: "National",
      tags: ["Digital", "Sovereignty", "Innovation"],
      status: "open"
    },
    {
      id: 6,
      title: "BPI Innovation Loan",
      description: "Low-interest loan to finance innovation. Amounts from €40k to €5M with possible deferred repayment.",
      organization: "Bpifrance",
      type: "Loan",
      budget: "€40k - €5M",
      location: "National",
      tags: ["Loan", "Innovation", "R&D"],
      status: "open"
    }
  ];

  const contacts: Contact[] = [
    {
      id: 1,
      name: "Claire Moreau",
      position: "Innovation Manager",
      organization: "Bpifrance",
      expertise: ["Funding", "Deep Tech", "Scale-up"],
      email: "c.moreau@bpifrance.fr",
      phone: "+33 1 23 45 67 89",
      website: "bpifrance.fr",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b77c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbnxlbnwxfHx8fDE3NTY3MzQxNjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 2,
      name: "Antoine Dubois",
      position: "Partner",
      organization: "Ventech Capital",
      expertise: ["VC", "B2B SaaS", "Marketplace"],
      email: "a.dubois@ventech.com",
      phone: "+33 1 45 67 89 01",
      website: "ventech.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW58ZW58MXx8fHwxNzU2NzM0MTYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 3,
      name: "Sandrine Laurent",
      position: "Development Director",
      organization: "Station F",
      expertise: ["Incubation", "Mentoring", "Ecosystem"],
      email: "s.laurent@stationf.co",
      website: "stationf.co",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbnxlbnwxfHx8fDE3NTY3MzQxNjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "closing-soon": return "bg-orange-100 text-orange-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
  case "open": return "Open";
  case "closing-soon": return "Closing soon";
  case "closed": return "Closed";
      default: return status;
    }
  };

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => (
    <Card 
      className="bg-white hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => {
        // Store opportunity data in sessionStorage
        sessionStorage.setItem('selectedOpportunity', JSON.stringify(opportunity));
        // Navigate to detail page using Next.js router
        window.location.href = '/OpportunityDetailPage';
      }}
    >
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{opportunity.title}</h3>
          <Badge className={getStatusColor(opportunity.status)}>
            {getStatusLabel(opportunity.status)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">{opportunity.organization}</p>
        <p className="text-gray-700 leading-relaxed">{opportunity.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          {opportunity.deadline && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {opportunity.deadline}</span>
            </div>
          )}
          {opportunity.budget && (
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4" />
              <span>Budget: {opportunity.budget}</span>
            </div>
          )}
          {opportunity.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{opportunity.location}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>{opportunity.type}</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              // Store opportunity data in sessionStorage
              sessionStorage.setItem('selectedOpportunity', JSON.stringify(opportunity));
              // Navigate to detail page using Next.js router
              window.location.href = '/OpportunityDetailPage';
            }}
          >
            Learn more
          </Button>
          {opportunity.url && (
            <Button variant="outline">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <Card className="bg-white hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            <p className="text-gray-600">{contact.position}</p>
            <p className="text-sm text-gray-500">{contact.organization}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {contact.expertise.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${contact.email}`} className="hover:text-primary">
              {contact.email}
            </a>
          </div>
          {contact.phone && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <a href={`tel:${contact.phone}`} className="hover:text-primary">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.website && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Globe className="h-4 w-4" />
              <a 
                href={`https://${contact.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {contact.website}
              </a>
            </div>
          )}
        </div>
        
        <Button variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Opportunities</h1>
          <p className="text-xl text-gray-600">
            Discover project calls, funding options, and useful contacts for your startup
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for an opportunity..."
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
                All
              </Button>
              <Button
                variant={selectedFilter === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("open")}
              >
                Open
              </Button>
              <Button
                variant={selectedFilter === "closing-soon" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("closing-soon")}
              >
                Closing soon
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Project Calls</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
            <TabsTrigger value="contacts">Useful Contacts</TabsTrigger>
          </TabsList>

          {/* Project Calls */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projectCalls.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </TabsContent>

          {/* Funding */}
          <TabsContent value="funding" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {funding.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </TabsContent>

          {/* Useful Contacts */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  {/* Footer rendered globally in _app.tsx */}
    </div>
  );
}

export default OpportunitiesPage;