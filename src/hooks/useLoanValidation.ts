
import { useState, useEffect } from 'react';
import { getAvailablePropertyValue, getPropertyLoanedAmount } from '@/services/loanService';

export const useLoanValidation = (propertyId: string, propertyValue: number) => {
  const [availableValue, setAvailableValue] = useState<number>(propertyValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAvailableValue = async () => {
      if (!propertyId || propertyValue <= 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get available value from API
        const availableVal = await getAvailablePropertyValue(propertyId, propertyValue);
        setAvailableValue(availableVal);
        
        // Also check localStorage for additional loans not yet in the API
        const localStorageAmount = getPropertyLoanedAmount(propertyId);
        
        // If we have local data, subtract it too (unless it's already accounted for in the API)
        if (localStorageAmount > 0) {
          setAvailableValue(prev => Math.max(prev - localStorageAmount, 0));
        }
        
        setError(null);
      } catch (err) {
        console.error("Error checking available property value:", err);
        setError('Failed to check available property value');
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailableValue();
  }, [propertyId, propertyValue]);

  return {
    availableValue,
    isLoading,
    error,
    maxLoanAmount: availableValue * 0.7, // Default LTV of 70%
    canApplyForLoan: availableValue > 0
  };
};
