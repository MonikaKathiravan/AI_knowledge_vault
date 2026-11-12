import { useState, useEffect } from 'react';

export const useFavorite = (itemType, itemId) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const check = async () => {
      if (!itemType || !itemId) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=${itemType}&itemId=${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && data.favorite) {
          setIsFavorite(true);
          setFavoriteId(data.favorite._id);
        }
      } catch (error) {
        console.error('Check favorite error:', error);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [itemType, itemId, token]);

  const toggle = async () => {
    if (isFavorite) {
      // Remove
      const res = await fetch(`http://localhost:5000/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } else {
      // Add
      const res = await fetch('http://localhost:5000/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemType, itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorite(true);
        setFavoriteId(data.favorite._id);
      }
    }
  };

  return { isFavorite, loading, toggle };
};