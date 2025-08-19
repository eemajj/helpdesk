import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;
    
    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.error || 'ข้อมูลที่ส่งไม่ถูกต้อง',
          status,
          code: 'BAD_REQUEST'
        };
      case 401:
        return {
          message: 'กรุณาเข้าสู่ระบบใหม่',
          status,
          code: 'UNAUTHORIZED'
        };
      case 403:
        return {
          message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
          status,
          code: 'FORBIDDEN'
        };
      case 404:
        return {
          message: 'ไม่พบข้อมูลที่ขอ',
          status,
          code: 'NOT_FOUND'
        };
      case 500:
        return {
          message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
          status,
          code: 'INTERNAL_ERROR'
        };
      default:
        return {
          message: data?.error || 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
          status,
          code: 'UNKNOWN_ERROR'
        };
    }
  }
  
  if (error instanceof Error) {
    return {
      message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
      code: 'GENERIC_ERROR'
    };
  }
  
  return {
    message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    code: 'UNKNOWN_ERROR'
  };
};

export const showErrorToast = (error: unknown) => {
  const apiError = handleApiError(error);
  toast.error(apiError.message);
};

// Setup axios interceptor for global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show toast for auth errors (handled by AuthContext)
    if (error?.response?.status !== 401) {
      const apiError = handleApiError(error);
      console.error('API Error:', apiError);
      
      // Show toast for user-facing errors
      if (apiError.status && apiError.status >= 400) {
        toast.error(apiError.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default handleApiError;