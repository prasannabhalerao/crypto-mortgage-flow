
import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-mortgage-dark">DefiMortgage</h3>
            <p className="text-gray-600 text-sm">
              A decentralized mortgage platform enabling property tokenization and 
              crypto-collateralized loan issuance using smart contracts.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-mortgage-dark">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 text-sm hover:text-mortgage-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 text-sm hover:text-mortgage-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/properties" className="text-gray-600 text-sm hover:text-mortgage-primary">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/loans" className="text-gray-600 text-sm hover:text-mortgage-primary">
                  Loans
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-mortgage-dark">Technologies</h3>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>Ethereum</li>
              <li>Solidity</li>
              <li>Truffle & Ganache</li>
              <li>MetaMask</li>
              <li>React.js</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} DefiMortgage. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
