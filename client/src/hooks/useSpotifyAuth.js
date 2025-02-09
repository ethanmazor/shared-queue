import { useState, useEffect } from 'react';

export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('spotify_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('spotify_token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('spotify_token');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading, user };
} 