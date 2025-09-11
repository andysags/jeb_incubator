import React, { useState } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Search, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";

// Simple ImageWithFallback component
const ImageWithFallback = ({
  src,
  alt,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc("https://via.placeholder.com/400x300?text=Image+indisponible")}
      {...props}
    />
  );
};

interface NewsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export default function NewsPage({ onNavigate }: NewsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const allNews = [
    {
      id: 1,
      title: "JEB announces a new GreenTech acceleration program",
      excerpt: "Discover our new program dedicated to GreenTech startups with funding of up to €500K and personalized support for 6 months.",
      content: "JEB is proud to announce the launch of its new acceleration program specifically designed for GreenTech startups. This innovative program aims to support entrepreneurs developing sustainable solutions to address current environmental challenges...",
      date: "January 15, 2025",
      readTime: "3 min",
      category: "Program",
      image: "https://images.unsplash.com/photo-1732284081090-8880f1e1905b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: true
    },
    {
      id: 2,
      title: "Success Story: EcoTech Solutions raises €2M",
      excerpt: "The startup incubated at JEB raises a record fundraising round to develop its IoT technology for building energy management.",
      content: "EcoTech Solutions, one of our flagship startups, has just completed a €2 million fundraising round. This round will enable the company to accelerate the development of its IoT platform...",
      date: "January 12, 2025",
      readTime: "4 min",
      category: "Success Story",
      image: "https://images.unsplash.com/photo-1609619385076-36a873425636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: false
    },
    {
      id: 3,
      title: "Demo Day on January 25: 10 startups to discover",
      excerpt: "Come discover the pitches of our 10 best startups during our monthly Demo Day. Registration is open!",
      content: "Our next Demo Day will take place on January 25th at 6 p.m. in our Paris offices. This monthly event is an opportunity to discover the latest innovations from our incubated startups...",
      date: "January 8, 2025",
      readTime: "2 min",
      category: "Event",
      image: "https://images.unsplash.com/photo-1707301280425-475534ec3cc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzU2NjU3NzkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: false
    },
    {
      id: 4,
      title: "Strategic Partnership with TechCorp",
      excerpt: "JEB partners with TechCorp to provide opportunities for collaboration between startups and large companies.",
      content: "We are delighted to announce our new partnership with TechCorp, a leader in digital transformation. This collaboration opens up new perspectives...",
      date: "January 5, 2025",
      readTime: "3 min",
      category: "Partnership",
      image: "https://images.unsplash.com/photo-1732284081090-8880f1e1905b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: false
    },
    {
      id: 5,
      title: "2024 Review: A Record Year for JEB",
      excerpt: "Looking back on an exceptional year with 45 new startups incubated and €15 million in funds raised by our entrepreneurs.",
      content: "The year 2024 will go down in JEB's history as a year of exceptional growth. With 45 new startups integrated into our incubation program...",
      date: "January 2, 2025",
      readTime: "5 min",
      category: "Review",
      image: "https://images.unsplash.com/photo-1609619385076-36a873425636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMHRlYW18ZW58MXx8fHwxNzU2NzMzODk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: false
    },
    {
      id: 6,
      title: "New mentor: Marie Dubois joins JEB",
      excerpt: "Former innovation director at InnovateCorp, Marie Dubois brings her expertise to startups in the JEB ecosystem.",
      content: "We are pleased to welcome Marie Dubois to our team of mentors. With 15 years of experience in corporate innovation...",
      date: "December 28, 2024",
      readTime: "2 min",
      category: "Team",
      image: "https://images.unsplash.com/photo-1707301280425-475534ec3cc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzU2NjU3NzkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      featured: false
    }
  ];

  const filteredNews = allNews.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredArticle = filteredNews.find(article => article.featured);
  const regularArticles = filteredNews.filter(article => !article.featured);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Programme": "bg-blue-100 text-blue-800",
      "Success Story": "bg-green-100 text-green-800",
      "Event": "bg-purple-100 text-purple-800",
      "Partnership": "bg-orange-100 text-orange-800",
      "Review": "bg-gray-100 text-gray-800",
      "Team": "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
      <div className="min-h-screen bg-gray-50">
<div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">News</h1>
          <p className="text-xl text-gray-600 mb-6">
            Follow the latest news from the JEB ecosystem
          </p>
          
          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <Card 
            className="mb-6 hover:shadow-lg transition-shadow cursor-pointer bg-white"
            onClick={() => onNavigate?.("news-detail", featuredArticle)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative">
                <ImageWithFallback
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-40 lg:h-48 object-cover lg:rounded-l-lg"
                />
                <Badge className={`absolute top-2 left-2 text-sm px-3 py-1 ${getCategoryColor(featuredArticle.category)}`}>
                  {featuredArticle.category}
                </Badge>
              </div>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{featuredArticle.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{featuredArticle.readTime}</span>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{featuredArticle.title}</h2>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{featuredArticle.excerpt}</p>
                <Button variant="outline" size="sm" className="w-fit text-sm h-8">
                Read the article
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regularArticles.map((article) => (
            <Card 
              key={article.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white h-full flex flex-col"
              onClick={() => onNavigate?.("news-detail", article)}
            >
              <CardHeader className="p-0">
                <div className="relative">
                  <ImageWithFallback
                    src={article.image}
                    alt={article.title}
                    className="w-full h-28 object-cover rounded-t-lg"
                  />
                  <Badge className={`absolute top-1 left-1 text-xs px-2 py-0.5 ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 flex-1 flex flex-col">
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-2.5 w-2.5" />
                    <span className="truncate">{article.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">{article.title}</h3>
                <p className="text-gray-600 text-xs flex-1 line-clamp-2 leading-relaxed">{article.excerpt}</p>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                  Read more
                  <ArrowRight className="ml-1 h-2.5 w-2.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles match your search.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Reset search
            </Button>
          </div>
        )}
      </div>
    </div>

            {/* Footer rendered globally in _app.tsx */}
      </div>
  );
}