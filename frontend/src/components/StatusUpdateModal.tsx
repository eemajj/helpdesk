import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  currentStatus: string;
  onStatusUpdated: (newStatus: string) => void;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  currentStatus,
  onStatusUpdated
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: 'yellow' },
    { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', color: 'blue' },
    { value: 'รอข้อมูลเพิ่มเติม', label: 'รอข้อมูลเพิ่มเติม', color: 'orange' },
    { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น', color: 'green' },
    { value: 'ยกเลิก', label: 'ยกเลิก', color: 'red' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newStatus === currentStatus && !comment.trim()) {
      toast.error('กรุณาเปลี่ยนสถานะหรือเพิ่มความคิดเห็น');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/tickets/update-status/${ticketId}`,
        {
          status: newStatus,
          comment: comment.trim(),
          isInternal
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('อัปเดตสถานะสำเร็จ');
        onStatusUpdated(newStatus);
        onClose();
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'gray';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            อัปเดตสถานะแจ้งปัญหา
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticket ID
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
              {ticketId}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              สถานะปัจจุบัน
            </label>
            <div className={`px-3 py-2 rounded-md text-sm inline-block bg-${getStatusColor(currentStatus)}-100 text-${getStatusColor(currentStatus)}-800`}>
              {currentStatus}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              สถานะใหม่ *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              required
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ความคิดเห็น / หมายเหตุ
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เพิ่มความคิดเห็นหรือหมายเหตุเกี่ยวกับการเปลี่ยนสถานะ..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isInternal"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="isInternal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              ความคิดเห็นภายใน (เฉพาะทีมงาน)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  อัปเดตสถานะ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;