import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import useUserBehavior from '../../hooks/useUserBehavior';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        categories: [],
        priceRange: { min: 0, max: 1000 },
        brands: []
    });
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updatePreferences } = useUserBehavior();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await axios.get('/api/recommendations/recommendations', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setRecommendations(response.data.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load recommendations');
                setLoading(false);
            }
        };

        if (user) {
            fetchRecommendations();
        }
    }, [user]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handlePreferenceChange = (type, value) => {
        setPreferences(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const handleSavePreferences = async () => {
        try {
            await updatePreferences(preferences);
            setShowPreferences(false);
            // Refresh recommendations
            const response = await axios.get('/api/recommendations/recommendations', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRecommendations(response.data.data);
        } catch (err) {
            setError('Failed to update preferences');
        }
    };

    if (loading) {
        return (
            <p></p>
            // <div className="flex justify-center items-center h-48">
            //     {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div> */}
            // </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center p-4">
                <p className="text-gray-600">Please log in to see personalized recommendations</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recommended for You</h2>
                <button
                    onClick={() => setShowPreferences(!showPreferences)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    {showPreferences ? 'Hide Preferences' : 'Customize Recommendations'}
                </button>
            </div>

            {showPreferences && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-lg font-semibold mb-4">Customize Your Recommendations</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price Range
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={preferences.priceRange.min}
                                    onChange={(e) => handlePreferenceChange('priceRange', {
                                        ...preferences.priceRange,
                                        min: Number(e.target.value)
                                    })}
                                    className="w-32 px-3 py-2 border rounded"
                                    placeholder="Min"
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    value={preferences.priceRange.max}
                                    onChange={(e) => handlePreferenceChange('priceRange', {
                                        ...preferences.priceRange,
                                        max: Number(e.target.value)
                                    })}
                                    className="w-32 px-3 py-2 border rounded"
                                    placeholder="Max"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSavePreferences}
                            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <div
                        key={product._id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleProductClick(product._id)}
                    >
                        <div className="relative pb-[100%]">
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-blue-600">
                                    ${product.price.toFixed(2)}
                                </span>
                                <div className="flex items-center">
                                    <span className="text-yellow-400">★</span>
                                    <span className="ml-1 text-gray-600">{product.rating}</span>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            {recommendations.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No recommendations available yet. Start browsing products to get personalized recommendations!
                </div>
            )}
        </div>
    );
};

export default Recommendations; 