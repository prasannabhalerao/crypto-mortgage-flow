
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { truncateAddress } from "@/lib/utils";

const Navbar: React.FC = () => {
  const { currentUser, logout, isAuthenticated, isAdmin } = useAuth();
  const { connectWallet, disconnect, account } = useWeb3();
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-mortgage-primary">
            DefiMortgage
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated && !isAdmin && (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium ${
                  location.pathname === "/dashboard"
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/properties"
                className={`text-sm font-medium ${
                  location.pathname.startsWith("/properties")
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                My Properties
              </Link>
              <Link
                to="/loans"
                className={`text-sm font-medium ${
                  location.pathname.startsWith("/loans")
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                My Loans
              </Link>
            </>
          )}
          
          {isAuthenticated && isAdmin && (
            <>
              <Link
                to="/admin/dashboard"
                className={`text-sm font-medium ${
                  location.pathname === "/admin/dashboard"
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/properties"
                className={`text-sm font-medium ${
                  location.pathname === "/admin/properties"
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                Property Requests
              </Link>
              <Link
                to="/admin/loans"
                className={`text-sm font-medium ${
                  location.pathname === "/admin/loans"
                    ? "text-mortgage-primary"
                    : "text-gray-600 hover:text-mortgage-primary"
                }`}
              >
                Loan Monitoring
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {account ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm"
                  onClick={disconnect}
                >
                  {truncateAddress(account)}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-mortgage-primary hover:bg-mortgage-accent text-white"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="text-sm text-gray-600"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button 
                size="sm" 
                className="bg-mortgage-primary hover:bg-mortgage-accent text-white"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
