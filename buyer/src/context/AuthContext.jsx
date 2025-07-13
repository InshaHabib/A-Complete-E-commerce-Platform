import { createContext, useContext, useState, useEffect } from 'react';
import { fetchDataFromApi } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token !== undefined && token !== null && token !== "") {
            setIsLogin(true);
            getUserDetails();
        } else {
            setIsLogin(false);
        }
    }, [isLogin]);

    const getUserDetails = () => {
        fetchDataFromApi(`/api/user/user-details`).then((res) => {
            setUserData(res.data);
            if (res?.response?.data?.error === true) {
                if (res?.response?.data?.message === "You have not login") {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    alertBox("error", "Your session is closed please login again");
                    setIsLogin(false);
                }
            }
        });
    };

    const value = {
        isLogin,
        setIsLogin,
        userData,
        setUserData,
        getUserDetails
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth; 