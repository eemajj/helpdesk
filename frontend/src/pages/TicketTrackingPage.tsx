import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Clock, User, Phone, Building, Edit, MessageSquare, CheckCircle, AlertCircle, Play, XCircle, ArrowLeft, Loader2, Calendar, Tag, Shield, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import StatusUpdateModal from '../components/StatusUpdateModal';
import { Link, useSearchParams } from 'react-router-dom';

interface TicketData {
  id: number;
  ticketId: string;
  problemType: string;
  otherProblemType?: string;
  problemDescription: string;
  fullName: string;
  phoneNumber: string;
  department: string;
  division: string;
  assetNumber?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: {
    fullName: string;
  };
  comments?: Array<{
    id: number;
    comment: string;
    createdAt: string;
    user: {
      fullName: string;
    };
  }>;
}

const TicketTrackingPage: React.FC = () => {
  const { t, formatThaiDate } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<{ ticketId: string }>();

  const getTimelineSteps = (status: string, createdAt: string, updatedAt: string) => {
    const steps = [
      {
        title: 'ได้รับคำขอ',
        description: 'ระบบได้รับการแจ้งปัญหาเรียบร้อย',
        time: formatThaiDate(createdAt),
        status: 'completed',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      },
      {
        title: 'กำหนดผู้รับผิดชอบ',
        description: 'มอบหมายให้เจ้าหน้าที่ดำเนินการ',
        time: formatThaiDate(createdAt),
        status: status === 'รอดำเนินการ' ? 'pending' : 'completed',
        icon: status === 'รอดำเนินการ' ? <Clock className="w-4 h-4 text-yellow-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />
      },
      {
        title: 'ดำเนินการแก้ไข',
        description: 'เจ้าหน้าที่กำลังแก้ไขปัญหา',
        time: status !== 'รอดำเนินการ' ? formatThaiDate(updatedAt) : '',
        status: status === 'กำลังดำเนินการ' || status === 'รอข้อมูลเพิ่มเติม' ? 'active' : status === 'เสร็จสิ้น' ? 'completed' : 'pending',
        icon: status === 'กำลังดำเนินการ' ? <Play className="w-4 h-4 text-blue-500" /> :
              status === 'รอข้อมูลเพิ่มเติม' ? <AlertCircle className="w-4 h-4 text-orange-500" /> :
              status === 'เสร็จสิ้น' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
              <Clock className="w-4 h-4 text-gray-400" />
      },
      {
        title: 'เสร็จสิ้น',
        description: 'ปัญหาได้รับการแก้ไขเรียบร้อย',
        time: status === 'เสร็จสิ้น' ? formatThaiDate(updatedAt) : '',
        status: status === 'เสร็จสิ้น' ? 'completed' : 'pending',
        icon: status === 'เสร็จสิ้น' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-gray-400" />
      }
    ];
    return steps;
  };

  const onSubmit = useCallback(async (data: { ticketId: string }) => {
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
  }, [t]);

  // Auto-search when URL parameters are present
  useEffect(() => {
    const ticketId = searchParams.get('id');
    const autoSearch = searchParams.get('autoSearch');
    
    if (ticketId && autoSearch === 'true') {
      setValue('ticketId', ticketId);
      onSubmit({ ticketId });
    }
  }, [searchParams, setValue, onSubmit]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'รอดำเนินการ':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'กำลังดำเนินการ':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'รอข้อมูลเพิ่มเติม':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'เสร็จสิ้น':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ยกเลิก':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-blue-50 via-white to-primary-50/30 dark:from-blue-900/20 dark:via-gray-800 dark:to-primary-900/10 py-8 px-4">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link to="/" className="group inline-flex items-center text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>กลับหน้าหลัก</span>
        </Link>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl shadow-lg mb-6">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-primary-600 dark:from-blue-400 dark:to-primary-400 bg-clip-text text-transparent">
              {t('tracking.title')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t('tracking.description')}
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-slide-up">
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="ticketId" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {t('tracking.search.label')}
                  </label>
                  <div className="relative">
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
                      placeholder={t('tracking.search.placeholder')}
                      className="w-full px-6 py-4 pr-14 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white text-lg font-medium transition-all duration-200"
                      aria-describedby={errors.ticketId ? 'ticketId-error' : undefined}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <Search className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                  </div>
                  {errors.ticketId && (
                    <p id="ticketId-error" className="mt-3 text-red-500 text-sm font-medium flex items-center" role="alert">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.ticketId.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-primary-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6 mr-3" />
                      {t('tracking.search.loading')}
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6 mr-3" />
                      {t('tracking.search.button')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50/80 dark:bg-red-900/10 backdrop-blur-md rounded-3xl shadow-xl border border-red-200/50 dark:border-red-800/50 overflow-hidden animate-fade-in">
              <div className="text-center py-12 px-8">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-lg">😔</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  🔍 {t('tracking.notFound.title')}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                  {t('tracking.notFound.description')}
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-800/50">
                  <h4 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-3">
                    💡 คำแนะนำ
                  </h4>
                  <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-2 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span>ตรวจสอบรูปแบบหมายเลข Ticket (TK1234567890)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span>ลองค้นหาในอีเมลที่ได้รับหลังแจ้งปัญหา</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span>ติดต่อทีมงานหากต้องการความช่วยเหลือ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details - Enhanced Design */}
        {ticket && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Status Overview - Hero Card */}
            <div className="relative overflow-hidden">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                {/* Status Header with Gradient */}
                <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 p-1 rounded-t-3xl">
                  <div className="bg-white dark:bg-gray-800 rounded-t-3xl p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Side - Ticket Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                              <span className="text-sm font-bold text-gray-900">✓</span>
                            </div>
                          </div>
                          <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                              ตั๋ว #{ticket.ticketId}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                              แจ้งโดย: {ticket.fullName}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side - Status Badge */}
                      <div className="text-center lg:text-right">
                        <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg ${
                          getStatusColor(ticket.status)
                        }`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-3">{getStatusText(ticket.status)}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                          อัพเดตล่าสุด: {formatThaiDate(ticket.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{ticket.priority}</div>
                    <div className="text-sm text-gray-500">ระดับความสำคัญ</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ticket.problemType}</div>
                    <div className="text-sm text-gray-500">ประเภทปัญหา</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ticket.department}</div>
                    <div className="text-sm text-gray-500">หน่วยงาน</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {ticket.assignedTo?.fullName || 'อัตโนมัติ'}
                    </div>
                    <div className="text-sm text-gray-500">ผู้รับผิดชอบ</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
                    {t('tracking.details.ticketId')} #{ticket.ticketId}
                  </h2>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{t('tracking.details.reportedAt')}: {formatThaiDate(ticket.createdAt)}</span>
                  </div>
                  {ticket.updatedAt !== ticket.createdAt && (
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{t('tracking.details.lastUpdate')}: {formatThaiDate(ticket.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ความคืบหน้า</h3>
              </div>
              <div className="card-body">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {getTimelineSteps(ticket.status, ticket.createdAt, ticket.updatedAt).map((step, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== getTimelineSteps(ticket.status, ticket.createdAt, ticket.updatedAt).length - 1 && (
                            <span 
                              className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                                step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                              }`} 
                              aria-hidden="true" 
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                                step.status === 'completed' 
                                  ? 'bg-green-500' 
                                  : step.status === 'active' 
                                    ? 'bg-blue-500' 
                                    : 'bg-gray-200'
                              }`}>
                                {step.icon}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className={`text-sm font-medium ${
                                  step.status === 'completed' 
                                    ? 'text-gray-900 dark:text-white' 
                                    : step.status === 'active'
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {step.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {step.description}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {step.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
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
                    {ticket.problemType}
                    {ticket.otherProblemType && ` (${ticket.otherProblemType})`}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('tracking.details.description')}
                  </label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {ticket.problemDescription}
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
                        <p className="text-gray-900 dark:text-white">{ticket.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tracking.details.phoneNumber')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{ticket.phoneNumber}</p>
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
                
                {ticket.assetNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('tracking.details.assetNumber')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{ticket.assetNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update Section - Admin/Support only */}
            {isAuthenticated && user && (user.role === 'admin' || user.role === 'support') && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    การจัดการเคส
                  </h3>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    อัปเดทสถานะ
                  </button>
                </div>
                
                {/* Comments Section */}
                {ticket.comments && ticket.comments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      ความคิดเห็น
                    </h4>
                    <div className="space-y-3">
                      {ticket.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {comment.user.fullName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatThaiDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Status Update Modal */}
            <StatusUpdateModal
              isOpen={showStatusModal}
              onClose={() => setShowStatusModal(false)}
              ticketId={ticket.ticketId}
              currentStatus={ticket.status}
              onStatusUpdated={(newStatus) => {
                setTicket(prev => prev ? { ...prev, status: newStatus } : null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketTrackingPage;