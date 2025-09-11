import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  Calendar, 
  MapPin, 
  Euro, 
  FileText, 
  Users, 
  Clock, 
  ExternalLink, 
  ArrowLeft, 
  Download,
  Mail,
  Phone,
  Globe,
  Building,
  Target,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
// Header and Footer are rendered globally in _app.tsx
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface OpportunityDetailPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function OpportunityDetailPage({ onNavigate }: OpportunityDetailPageProps) {
  const router = useRouter();
  const [opportunityData, setOpportunityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load opportunity data from sessionStorage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('selectedOpportunity');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Extend the basic opportunity data with detailed information
        const extendedData = {
          ...parsedData,
          // Add detailed fields that might not be in the basic opportunity
          fullDescription: `
Detailed description for ${parsedData.title}.

This opportunity offers comprehensive support for innovative projects in the field of ${parsedData.tags?.[0] || 'innovation'}. 

Our program provides not only financial assistance but also strategic mentoring, access to our network of industry experts, and facilitated connections with potential partners and customers.

Selected participants will benefit from a structured approach that includes regular milestone reviews, customized support based on project needs, and access to specialized resources and laboratories.
          `,
          organization: {
            name: parsedData.organization || "Organization",
            logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3Zlcm5tZW50JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzU2NzM0Mzg5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            website: "https://www.example.com",
            contact: "contact@example.com"
          },
          applicationOpenDate: "January 10, 2025",
          budget: {
            min: parsedData.budget?.split(' - ')[0] || "€50k",
            max: parsedData.budget || "€500k",
            total: "€5M total envelope"
          },
          duration: "18 months maximum",
          eligibility: [
            "Startups and SMEs",
            "Innovative projects with market potential",
            "Teams with relevant expertise",
            "Clear business model and growth strategy",
            "Technology readiness level appropriate for the program"
          ],
          selectionCriteria: [
            "Innovation level and market potential",
            "Team quality and expertise",
            "Project feasibility and timeline",
            "Expected impact and scalability",
            "Strategic fit with program objectives"
          ],
          applicationProcess: [
            {
              step: 1,
              title: "Online application",
              description: "Submit your project summary and team information",
              deadline: "February 15, 2025"
            },
            {
              step: 2,
              title: "Document review",
              description: "Detailed evaluation of submitted materials",
              deadline: "March 1, 2025"
            },
            {
              step: 3,
              title: "Interview",
              description: "Presentation to the selection committee",
              deadline: "March 15, 2025"
            },
            {
              step: 4,
              title: "Results",
              description: "Notification of selected projects",
              deadline: "March 30, 2025"
            }
          ],
          benefits: [
            `Financial support up to ${parsedData.budget || '€500k'}`,
            "Access to expert mentoring",
            "Networking opportunities",
            "Technical and business support",
            "Market access facilitation",
            "International development support"
          ],
          documents: [
            { name: "Application guide", url: "#", type: "PDF" },
            { name: "Application form", url: "#", type: "DOCX" },
            { name: "Budget template", url: "#", type: "XLSX" },
            { name: "Eligibility checklist", url: "#", type: "PDF" }
          ],
          contact: {
            name: "Program Manager",
            position: "Innovation Program Manager",
            email: "contact@program.com",
            phone: "+33 1 23 45 67 89",
            department: "Innovation Department"
          },
          relatedOpportunities: [
            {
              id: 2,
              title: "Tech Acceleration Program",
              organization: "Innovation Hub",
              type: "Acceleration",
              status: "open"
            },
            {
              id: 3,
              title: "Startup Challenge",
              organization: "Tech City",
              type: "Competition",
              status: "closing-soon"
            }
          ]
        };
        setOpportunityData(extendedData);
      }
    } catch (error) {
      console.error('Error loading opportunity data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // If no data found, redirect back to opportunities
  useEffect(() => {
    if (!loading && !opportunityData) {
      router.push('/OpportunitiesPage');
    }
  }, [loading, opportunityData, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading opportunity details...</p>
        </div>
      </div>
    );
  }

  if (!opportunityData) {
    return null; // Will redirect to opportunities page
  }

  // Use the loaded data instead of the static data
  const opportunityDetail = opportunityData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800 border-green-200";
      case "closing-soon": return "bg-orange-100 text-orange-800 border-orange-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <CheckCircle className="h-4 w-4" />;
      case "closing-soon": return <AlertCircle className="h-4 w-4" />;
      case "closed": return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "Applications Open";
      case "closing-soon": return "Closing Soon";
      case "closed": return "Applications Closed";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </div>

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-400 px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <Badge className={`${getStatusColor(opportunityDetail.status)} border`}>
                      {getStatusIcon(opportunityDetail.status)}
                      <span className="ml-1">{getStatusLabel(opportunityDetail.status)}</span>
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {opportunityDetail.type}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3">
                    {opportunityDetail.title}
                  </h1>
                  <p className="text-purple-100 text-lg leading-relaxed">
                    {opportunityDetail.shortDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Information */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900">{opportunityDetail.deadline}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Euro className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900">{opportunityDetail.budget.max}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">{opportunityDetail.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900">{opportunityDetail.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-purple-600">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {opportunityDetail.fullDescription}
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {(opportunityDetail.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Information Tabs */}
              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue="eligibility" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 rounded-t-lg">
                      <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                      <TabsTrigger value="criteria">Selection</TabsTrigger>
                      <TabsTrigger value="process">Process</TabsTrigger>
                      <TabsTrigger value="benefits">Benefits</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="eligibility" className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Eligibility Criteria</h3>
                      <ul className="space-y-3">
                        {(opportunityDetail.eligibility || []).map((criterion: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    
                    <TabsContent value="criteria" className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Selection Criteria</h3>
                      <ul className="space-y-3">
                        {(opportunityDetail.selectionCriteria || []).map((criterion: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <Target className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    
                    <TabsContent value="process" className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Application Process</h3>
                      <div className="space-y-6">
                        {(opportunityDetail.applicationProcess || []).map((step: any, index: number) => (
                          <div key={index} className="flex space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {step.step}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{step.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                              <p className="text-purple-600 text-sm font-medium mt-1">
                                Deadline: {step.deadline}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="benefits" className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Benefits & Support</h3>
                      <ul className="space-y-3">
                        {(opportunityDetail.benefits || []).map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Organization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={opportunityDetail.organization.logo}
                      alt={opportunityDetail.organization.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {opportunityDetail.organization.name}
                      </h3>
                      <a 
                        href={opportunityDetail.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Visit website
                      </a>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{opportunityDetail.contact.name}</h4>
                    <p className="text-sm text-gray-600">{opportunityDetail.contact.position}</p>
                    <p className="text-sm text-gray-500">{opportunityDetail.contact.department}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <a 
                      href={`mailto:${opportunityDetail.contact.email}`}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-purple-600"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{opportunityDetail.contact.email}</span>
                    </a>
                    <a 
                      href={`tel:${opportunityDetail.contact.phone}`}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-purple-600"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{opportunityDetail.contact.phone}</span>
                    </a>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(opportunityDetail.documents || []).map((doc: any, index: number) => (
                      <a
                        key={index}
                        href={doc.url}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.type}
                          </Badge>
                          <Download className="h-4 w-4 text-gray-400" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">Budget Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Minimum:</span>
                    <span className="font-semibold text-gray-900">{opportunityDetail.budget.min}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maximum:</span>
                    <span className="font-semibold text-gray-900">{opportunityDetail.budget.max}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total envelope:</span>
                    <span className="font-semibold text-purple-600">{opportunityDetail.budget.total}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Opportunities */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(opportunityDetail.relatedOpportunities || []).map((opportunity: any) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status === "open" ? "Open" : "Closing Soon"}
                      </Badge>
                      <Badge variant="outline">{opportunity.type}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{opportunity.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{opportunity.organization}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

  {/* Footer rendered globally in _app.tsx */}
    </div>
  );
}
