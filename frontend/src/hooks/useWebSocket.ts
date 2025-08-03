import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

// Fixed: Added 'new_notification' to type
interface WebSocketMessage {
  type: 'ping' | 'pong' | 'notification' | 'ticket_update' | 'comment_added' | 'new_notification';
  data?: any;
}

// Fixed: Added 'is_read' to interface
interface NotificationData {
  id: number;
  title: string;
  message: string;
  ticket_id?: string;
  created_at: string;
  is_read: boolean;
}

interface TicketUpdateData {
  ticket_id: string;
  status: string;
  assigned_to?: number;
  updated_at: string;
}

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastTicketUpdate, setLastTicketUpdate] = useState<TicketUpdateData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // ป้องกันการเชื่อมต่อซ้ำ - เช็คทั้ง wsRef และ connection state
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING || 
        !isAuthenticated || !user) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // ใช้ base URL แทน API URL เพื่อหลีกเลี่ยง /api ซ้ำ
      const baseUrl = 'ws://localhost:3002';
      wsRef.current = new WebSocket(`${baseUrl}/api/ws?token=${token}`);
      console.log('🔌 Attempting to connect WebSocket...');

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      handleMessage(message);
    };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Auto-reconnect หลังจาก 3 วินาที หากยัง authenticated อยู่
        if (isAuthenticated && user && event.code !== 1000) { // 1000 = normal closure
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.warn('⚠️ WebSocket error (อาจเป็น React StrictMode):', error);
        console.log('🔗 WebSocket URL was:', `${baseUrl}/api/ws?token=${token.substring(0, 20)}...`);
        setIsConnected(false);
        wsRef.current = null;
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
    }
  }, [isAuthenticated, user]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 Disconnecting WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 WebSocket message received:', message);
    switch (message.type) {
      case 'new_notification':
        toast.success(`New Notification: ${message.data.title}`);
        const newNotification = { ...message.data, is_read: false };
        setNotifications(prev => [newNotification, ...prev]);
        break;
      case 'ticket_update':
        setLastTicketUpdate(message.data);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user]); // ลบ connect, disconnect ออกเพื่อป้องกัน infinite loop

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Fixed: Created and exported markAsRead function
  const markAsRead = useCallback(async (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
    try {
      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      await api.put(`/dashboard/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification status.');
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: false } : notif
        )
      );
    }
  }, []);

  // Fixed: Correctly returning all functions and state
  return {
    isConnected,
    notifications,
    setNotifications,
    lastTicketUpdate,
    sendMessage,
    connect,
    disconnect,
    clearNotifications,
    markAsRead,
  };
};