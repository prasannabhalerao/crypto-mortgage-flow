
import { supabase } from "../integrations/supabase/client";
import { Property } from "../types";
import { mockProperties } from "./mockData";

// Create a local backup of mockProperties (will be migrated to Supabase)
let properties: Property[] = [...mockProperties];

// Get all properties
export const getAllProperties = async (): Promise<Property[]> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*');
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      owner: p.owner,
      title: p.title,
      description: p.description,
      location: p.location,
      value: Number(p.value),
      imageUrl: p.image_url,
      status: p.status,
      tokenId: p.token_id,
      createdAt: new Date(p.created_at)
    })) as Property[];
  } catch (error) {
    console.error("Error fetching properties from Supabase:", error);
    
    // Fallback to mock data if Supabase fails
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...properties];
  }
};

// Get properties by owner address
export const getPropertiesByOwner = async (ownerAddress: string): Promise<Property[]> => {
  if (!ownerAddress) return [];
  
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner', ownerAddress.toLowerCase());
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      owner: p.owner,
      title: p.title,
      description: p.description,
      location: p.location,
      value: Number(p.value),
      imageUrl: p.image_url,
      status: p.status,
      tokenId: p.token_id,
      createdAt: new Date(p.created_at)
    })) as Property[];
  } catch (error) {
    console.error("Error fetching properties by owner from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return properties.filter(property => 
      property.owner.toLowerCase() === ownerAddress.toLowerCase()
    );
  }
};

// Get user properties (by user ID)
export const getUserProperties = async (userId: string): Promise<Property[]> => {
  if (!userId) return [];
  
  // For now, we're using wallet addresses as user IDs
  return getPropertiesByOwner(userId);
};

// Get properties by status (for admin dashboard)
export const getPropertiesByStatus = async (status: Property["status"]): Promise<Property[]> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', status);
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      owner: p.owner,
      title: p.title,
      description: p.description,
      location: p.location,
      value: Number(p.value),
      imageUrl: p.image_url,
      status: p.status,
      tokenId: p.token_id,
      createdAt: new Date(p.created_at)
    })) as Property[];
  } catch (error) {
    console.error("Error fetching properties by status from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return properties.filter(property => property.status === status);
  }
};

// Get property by ID
export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      owner: data.owner,
      title: data.title,
      description: data.description,
      location: data.location,
      value: Number(data.value),
      imageUrl: data.image_url,
      status: data.status,
      tokenId: data.token_id,
      createdAt: new Date(data.created_at)
    } as Property;
  } catch (error) {
    console.error("Error fetching property by ID from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return properties.find(property => property.id === id);
  }
};

// Add new property
export const addProperty = async (property: Omit<Property, "id" | "createdAt" | "status">): Promise<Property> => {
  try {
    const propertyData = {
      owner: property.owner.toLowerCase(),
      title: property.title,
      description: property.description,
      location: property.location,
      value: property.value,
      image_url: property.imageUrl,
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      owner: data.owner,
      title: data.title,
      description: data.description,
      location: data.location,
      value: Number(data.value),
      imageUrl: data.image_url,
      status: data.status,
      tokenId: data.token_id,
      createdAt: new Date(data.created_at)
    } as Property;
  } catch (error) {
    console.error("Error adding property to Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newProperty: Property = {
      ...property,
      id: `prop${properties.length + 1}`,
      status: "pending",
      createdAt: new Date()
    };
    
    properties.push(newProperty);
    return newProperty;
  }
};

// Update property status
export const updatePropertyStatus = async (id: string, status: Property["status"], tokenId?: string): Promise<Property> => {
  try {
    const updateData: any = { status };
    if (tokenId) updateData.token_id = tokenId;
    
    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      owner: data.owner,
      title: data.title,
      description: data.description,
      location: data.location,
      value: Number(data.value),
      imageUrl: data.image_url,
      status: data.status,
      tokenId: data.token_id,
      createdAt: new Date(data.created_at)
    } as Property;
  } catch (error) {
    console.error("Error updating property status in Supabase:", error);
    
    // Fallback to mock data
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
  }
};

// Migrate mock data to Supabase (can be called on app initialization)
export const migrateMockDataToSupabase = async () => {
  try {
    // Check if we already have properties in Supabase
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Only migrate if no properties exist yet
    if (count === 0) {
      const propertiesToInsert = mockProperties.map(prop => ({
        id: prop.id,
        owner: prop.owner.toLowerCase(),
        title: prop.title,
        description: prop.description,
        location: prop.location,
        value: prop.value,
        image_url: prop.imageUrl,
        status: prop.status,
        token_id: prop.tokenId,
        created_at: prop.createdAt.toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('properties')
        .insert(propertiesToInsert);
      
      if (insertError) throw insertError;
      console.log("Successfully migrated mock properties to Supabase");
    }
  } catch (error) {
    console.error("Error migrating mock data to Supabase:", error);
  }
};

// Reset to mock data (for testing)
export const resetProperties = () => {
  properties = [...mockProperties];
};

// Call this function to migrate data on app initialization
migrateMockDataToSupabase();
