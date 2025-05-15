
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import PropertyForm from "@/components/property/PropertyForm";

const PropertyNew: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-mortgage-dark mb-6">Register a New Property</h1>
        <PropertyForm />
      </div>
    </MainLayout>
  );
};

export default PropertyNew;
