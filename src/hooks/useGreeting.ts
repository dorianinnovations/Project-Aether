/**
 * Custom hook for managing dynamic greeting state and logic
 */
import { useState, useEffect } from 'react';
import { TokenManager } from '../services/api';

interface UseGreetingReturn {
  userName: string;
  greetingText: string;
  showGreeting: boolean;
  setShowGreeting: (show: boolean) => void;
}

export const useGreeting = (): UseGreetingReturn => {
  const [userName, setUserName] = useState<string>('');
  const [greetingText, setGreetingText] = useState<string>('');
  const [showGreeting, setShowGreeting] = useState<boolean>(true);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  // Initialize dynamic greeting
  useEffect(() => {
    const initializeGreeting = async () => {
      try {
        const userData = await TokenManager.getUserData();
        const firstName = userData?.name?.split(' ')[0] || 'User';
        setUserName(firstName);
        
        const timeGreeting = getTimeBasedGreeting();
        setGreetingText(`${timeGreeting}, ${firstName}`);
      } catch (error) {
        // Fallback with current time-based greeting
        const timeGreeting = getTimeBasedGreeting();
        setGreetingText(`${timeGreeting}, User`);
      }
    };
    
    initializeGreeting();
  }, []);

  return {
    userName,
    greetingText,
    showGreeting,
    setShowGreeting,
  };
};