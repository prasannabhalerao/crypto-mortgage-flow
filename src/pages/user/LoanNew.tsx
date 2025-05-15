
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import LoanForm from "@/components/loan/LoanForm";

const LoanNew: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-mortgage-dark mb-6">Apply for a Loan</h1>
        <LoanForm />
      </div>
    </MainLayout>
  );
};

export default LoanNew;
