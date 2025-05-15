
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-10 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-mortgage-dark mb-6">
                Decentralized Mortgage Platform
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Tokenize your property and get crypto-collateralized loans using smart contracts.
                Safe, transparent, and efficient.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-mortgage-primary hover:bg-mortgage-accent">
                    Get Started
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-mortgage-primary text-mortgage-primary">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop" 
                alt="Modern property" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mortgage-dark mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our decentralized mortgage platform simplifies property tokenization and crypto-backed loans.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-mortgage-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-mortgage-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-mortgage-dark mb-3">Tokenize Your Property</h3>
              <p className="text-gray-600">
                Register your property, get admin approval, and receive an ERC-721 token representing your property.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-mortgage-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-mortgage-primary">2</span>
              </div>
              <h3 className="text-xl font-bold text-mortgage-dark mb-3">Request a Loan</h3>
              <p className="text-gray-600">
                Use your property token plus some ETH as collateral to request a loan with favorable terms.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-mortgage-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="font-bold text-mortgage-primary">3</span>
              </div>
              <h3 className="text-xl font-bold text-mortgage-dark mb-3">Manage Your Loan</h3>
              <p className="text-gray-600">
                Track your loan status, make repayments, and retrieve your collateral upon full repayment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mortgage-dark mb-4">Platform Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built with security and transparency in mind
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4">
              <h3 className="font-bold text-mortgage-dark mb-2">Property Tokenization</h3>
              <p className="text-gray-600">Convert your property into a digital token on the blockchain.</p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-mortgage-dark mb-2">Smart Contracts</h3>
              <p className="text-gray-600">Secure, transparent, and self-executing loan agreements.</p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-mortgage-dark mb-2">MetaMask Integration</h3>
              <p className="text-gray-600">Connect your wallet for secure blockchain transactions.</p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-mortgage-dark mb-2">Loan Dashboard</h3>
              <p className="text-gray-600">Monitor your loan status, payments, and property tokens.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-mortgage-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our decentralized mortgage platform and unlock the value of your property today.
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-mortgage-primary hover:bg-gray-100 border-white"
            >
              Create Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
