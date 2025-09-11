import React, { useState } from "react";
import OpportunitiesPage from "./OpportunitiesPage";
import OpportunityDetailPage from "./OpportunityDetailPage";

interface OpportunityFlowProps {}

export default function OpportunityFlow({}: OpportunityFlowProps) {
  const [currentPage, setCurrentPage] = useState<string>("opportunities");
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  const handleNavigation = (page: string, data?: any) => {
    setCurrentPage(page);
    if (data) {
      setSelectedOpportunity(data);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "opportunities":
        return <OpportunitiesPage onNavigate={handleNavigation} />;
      case "opportunity-detail":
        return <OpportunityDetailPage onNavigate={handleNavigation} />;
      default:
        return <OpportunitiesPage onNavigate={handleNavigation} />;
    }
  };

  return renderCurrentPage();
}
