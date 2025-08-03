import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Clock, User, Phone, Building } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../hooks/useLanguage';

interface TicketData {
  ticket_id: string;
  problem_type: string;
  other_problem_type?: string;
  problem_description: string;
  full_name: string;
  phone_number: string;
  department: string;
  division: string;
  asset_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
}

const TicketTrackingPage: React.FC = () => {
  const { t, formatThaiDate } = useLanguage();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{ ticketId: string }>();

  const onSubmit = async (data: { ticketId: string }) => {
    setIsLoading(true);
    setNotFound(false);
    setTicket(null);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/tickets/track/${data.ticketId}`);
      
      if (response.data.success) {
        setTicket(response.data.ticket);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(t('tracking.errors.searchError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'กำลังดำเนินการ':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'รอข้อมูลเพิ่มเติม':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'เสร็จสิ้น':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ยกเลิก':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'รอดำเนินการ':
        return t('tracking.status.pending');
      case 'กำลังดำเนินการ':
        return t('tracking.status.inProgress');
      case 'รอข้อมูลเพิ่มเติม':
        return t('tracking.status.waitingInfo');
      case 'เสร็จสิ้น':
        return t('tracking.status.completed');
      case 'ยกเลิก':
        return t('tracking.status.cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('tracking.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('tracking.description')}
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="ticketId" className="sr-only">
                  {t('tracking.search.label')}
                </label>
                <input
                  type="text"
                  id="ticketId"
                  {...register('ticketId', { 
                    required: t('tracking.errors.ticketIdRequired'),
                    pattern: {
                      value: /^TK\d+$/,
                      message: t('tracking.errors.invalidFormat')
                    }
                  })}
                  className="form-input"
                  placeholder={t('tracking.search.placeholder')}
                  aria-describedby={errors.ticketId ? 'ticketId-error' : undefined}
                />
                {errors.ticketId && (
                  <p id="ticketId-error" className="form-error" role="alert">
                    {errors.ticketId.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('tracking.search.loading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>{t('tracking.search.button')}</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="card animate-fade-in">
            <div className="card-body text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('tracking.notFound.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('tracking.notFound.description')}
              </p>
            </div>
          </div>
        )}

        {/* Ticket Details */}
        {ticket && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Overview */}
            <div className="card">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
                    {t('tracking.details.ticketId')} #{ticket.ticket_id}
                  </h2>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{t('tracking.details.reportedAt')}: {formatThaiDate(ticket.created_at)}</span>
                  </div>
                  {ticket.updated_at !== ticket.created_at && (
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{t('tracking.details.lastUpdate')}: {formatThaiDate(ticket.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Details */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('tracking.details.problemDetails')}
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tracking.details.problemType')}
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {ticket.problem_type}
                    {ticket.other_problem_type && ` (${ticket.other_problem_type})`}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tracking.details.description')}
                  </label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {ticket.problem_description}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('tracking.details.reporterInfo')}
                </h3>
              </div>
              <div className="card-body">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tracking.details.fullName')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{ticket.full_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tracking.details.phoneNumber')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{ticket.phone_number}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tracking.details.department')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{ticket.department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tracking.details.division')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{ticket.division}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {ticket.asset_number && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('tracking.details.assetNumber')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{ticket.asset_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline/Comments would go here in future phases */}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketTrackingPage;