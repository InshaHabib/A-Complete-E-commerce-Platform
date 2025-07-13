import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useUserBehavior = (productId) => {
    const [isTracking, setIsTracking] = useState(false);
    const startTime = useRef(Date.now());

    useEffect(() => {
        if (productId) {
            startTime.current = Date.now();
            trackView();
        }

        return () => {
            if (isTracking) {
                const duration = Math.floor((Date.now() - startTime.current) / 1000); // Convert to seconds
                trackViewDuration(duration);
            }
        };
    }, [productId]);

    const trackView = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post(
                '/api/recommendations/track-view',
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsTracking(true);
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const trackViewDuration = async (duration) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post(
                '/api/recommendations/track-view-duration',
                { productId, duration },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error tracking view duration:', error);
        }
    };

    const trackPurchase = async (quantity) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post(
                '/api/recommendations/track-purchase',
                { productId, quantity },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error tracking purchase:', error);
        }
    };

    const updatePreferences = async (preferences) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post(
                '/api/recommendations/preferences',
                preferences,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    };

    const getPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const response = await axios.get('/api/recommendations/preferences', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error getting preferences:', error);
            return null;
        }
    };

    return {
        isTracking,
        trackView,
        trackPurchase,
        updatePreferences,
        getPreferences
    };
};

export default useUserBehavior; 