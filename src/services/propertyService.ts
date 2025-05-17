
import { Property } from "../types";
import { mockProperties } from "./mockData";

// Create a mutable copy of mockProperties for our mock service
let properties: Property[] = [...mockProperties];

// Get all properties
export const getAllProperties = async (): Promise<Property[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...properties];
};

// Get properties by owner address
export const getPropertiesByOwner = async (ownerAddress: string): Promise<Property[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return properties.filter(property => property.owner.toLowerCase() === ownerAddress.toLowerCase());
};

// Get user properties (by user ID)
export const getUserProperties = async (userId: string): Promise<Property[]> => {
  // For now, we'll use getPropertiesByOwner since we're using wallet addresses as IDs
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return properties.filter(property => property.owner.toLowerCase() === userId.toLowerCase());
};

// Get properties by status (for admin dashboard)
export const getPropertiesByStatus = async (status: Property["status"]): Promise<Property[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return properties.filter(property => property.status === status);
};

// Get property by ID
export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return properties.find(property => property.id === id);
};

// Add new property
export const addProperty = async (property: Omit<Property, "id" | "createdAt" | "status">): Promise<Property> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newProperty: Property = {
    ...property,
    id: `prop${properties.length + 1}`,
    status: "pending",
    createdAt: new Date()
  };
  
  properties.push(newProperty);
  return newProperty;
};

// Update property status
export const updatePropertyStatus = async (id: string, status: Property["status"], tokenId?: string): Promise<Property> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const propertyIndex = properties.findIndex(p => p.id === id);
  if (propertyIndex === -1) {
    throw new Error("Property not found");
  }
  
  const updatedProperty = {
    ...properties[propertyIndex],
    status,
    ...(tokenId ? { tokenId } : {})
  };
  
  properties[propertyIndex] = updatedProperty;
  return updatedProperty;
};

// Reset to mock data (for testing)
export const resetProperties = () => {
  properties = [...mockProperties];
};
