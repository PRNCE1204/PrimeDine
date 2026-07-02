import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { serverUrl } from '../App';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { userData } = useSelector(state => state.user);

    useEffect(() => {
        // Initialize the socket connection
        const socketInstance = io(serverUrl, { 
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log('Connected to socket server:', socketInstance.id);
            if (userData?._id) {
                // Identify the user upon connection
                socketInstance.emit('identity', { userId: userData._id });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, [userData?._id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
