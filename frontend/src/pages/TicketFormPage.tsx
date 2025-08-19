import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Send, AlertCircle, CheckCircle, FileText, User, Building2, Star, Search } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Link } from 'react-router-dom';
// import FileUpload from '../components/FileUpload';

const ProblemType = z.enum([
  'ฮาร์ดแวร์',
  'ซอฟต์แวร์',
  'เครือข่าย',
  'เครื่องพิมพ์',
  'โทรศัพท์',
  'อีเมล',
  'ระบบงาน',
  'ไวรัส',
  'สำรองข้อมูล',
  'การอบรม',
  'อื่นๆ'
]);

const Department = z.enum([
  'สลก.',
  'กยผ.',
  'กสค.',
  'กสพ.',
  'กคอ.',
  'ศจท.',
  'กพร.',
  'ตสน.'
]);

const ticketSchema = z.object({
  problemType: ProblemType,
  otherProblemType: z.string().optional(),
  problemDescription: z.string().min(10, 'รายละเอียดปัญหาต้องมีอย่างน้อย 10 ตัวอักษร'),
  fullName: z.string().min(2, 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร'),
  phoneNumber: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  department: Department,
  division: z.string().optional(),
  assetNumber: z.string().optional()
});

type TicketFormData = z.infer<typeof ticketSchema>;

// interface UploadedFile {
//   filename: string;
//   originalname: string;
//   mimetype: string;
//   size: number;
//   url: string;
// }

const TicketFormPage: React.FC = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');
  // const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);
  // const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  // const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema)
  });

  const watchProblemType = watch('problemType');
  const watchedFields = watch();

  // Calculate form progress
  React.useEffect(() => {
    const requiredFields = ['problemType', 'problemDescription', 'fullName', 'phoneNumber', 'department'];
    const filledFields = requiredFields.filter(field => {
      const value = watchedFields[field as keyof TicketFormData];
      return value && value.toString().trim() !== '';
    });
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [watchedFields]);

  // Real-time field validation (disabled for debugging)
  // const validateField = (fieldName: keyof TicketFormData, value: string) => {
  //   const fieldSchema = ticketSchema.shape[fieldName];
  //   try {
  //     fieldSchema.parse(value);
  //     setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
  //     return true;
  //   } catch (error: any) {
  //     setValidationErrors(prev => ({ ...prev, [fieldName]: error.errors[0]?.message || 'Invalid input' }));
  //     return false;
  //   }
  // };

  // Handle field blur for validation (disabled for debugging)
  // const handleFieldBlur = (fieldName: keyof TicketFormData, value: string) => {
  //   setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  //   validateField(fieldName, value);
  // };

  // const handleFilesUploaded = (files: UploadedFile[]) => {
  //   setUploadedFiles(files);
  // };


  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting form data:', data);
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      // Clean up data to match backend expectations
      const cleanData = {
        problemType: data.problemType,
        problemDescription: data.problemDescription,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        department: data.department,
        ...(data.otherProblemType && { otherProblemType: data.otherProblemType }),
        ...(data.division && { division: data.division }),
        ...(data.assetNumber && { assetNumber: data.assetNumber })
      };
      
      console.log('Cleaned form data:', cleanData);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/tickets`, cleanData);
      
      if (response.data.success) {
        const newTicketId = response.data.ticket.ticketId;
        
        // แนบไฟล์กับ ticket ถ้ามี (ปิดใช้งานชั่วคราว)
        /* if (uploadedFiles.length > 0) {
          try {
            await axios.post(`/files/attach/${newTicketId}`, {
              files: uploadedFiles
            });
          } catch (attachError) {
            console.error('File attach error:', attachError);
            toast.error('เกิดข้อผิดพลาดในการแนบไฟล์ แต่ Ticket ถูกสร้างสำเร็จแล้ว');
          }
        } */
        
        setTicketId(newTicketId);
        setSubmitSuccess(true);
        toast.success(t('messages.ticketSubmitted'));
        reset();
        // setUploadedFiles([]);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Validation details:', error.response?.data?.details);
      
      const errorMessage = error.response?.data?.error || 
                          (error.response?.data?.details ? 
                            `Validation error: ${JSON.stringify(error.response.data.details)}` : 
                            t('messages.submitError'));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setSubmitSuccess(false);
    setTicketId('');
    // setUploadedFiles([]);
  };

  if (submitSuccess) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-green-50 via-white to-primary-50 dark:from-green-900/20 dark:via-gray-800 dark:to-primary-900/10 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Success Animation Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.3)_0%,transparent_70%)]"></div>
            </div>
            
            <div className="relative px-8 py-12">
              {/* Success Icon */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('ticketForm.success.title')}
                </span>
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t('ticketForm.success.ticketId')}
              </p>
              
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl p-6 mb-8 border border-primary-200/50 dark:border-primary-700/50">
                <div className="text-sm text-primary-600 dark:text-primary-400 font-semibold mb-2">หมายเลข Ticket</div>
                <code className="text-2xl font-bold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl">
                  {ticketId}
                </code>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-8 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 {t('ticketForm.success.saveCode')}
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleNewTicket}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl hover:from-primary-700 hover:to-primary-800 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary-500/25"
                >
                  <FileText className="w-5 h-5 mr-2 inline" />
                  {t('ticketForm.success.newTicket')}
                </button>
                <Link
                  to="/track"
                  className="w-full inline-flex items-center justify-center bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300 font-semibold py-4 px-6 rounded-2xl border-2 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105 transition-all duration-300"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {t('ticketForm.success.trackTicket')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center animate-fade-in">
            <FileText className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('ticketForm.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('ticketForm.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">ข้อมูลปัญหา</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4 rounded"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ข้อมูลผู้แจ้ง</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-4 rounded"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ส่งคำขอ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">

        {/* Progress Indicator */}
        <div className="mb-8 animate-slide-up">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ความคืบหน้าการกรอกฟอร์ม</h3>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {Math.round(formProgress)}% เสร็จสิ้น
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${formProgress}%` }}
              >
                {formProgress > 0 && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>เริ่มต้น</span>
              <span>ข้อมูลปัญหา</span>
              <span>ข้อมูลผู้แจ้ง</span>
              <span>เสร็จสิ้น</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
          {/* ข้อมูลปัญหา - Step 1 */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-900">1</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    📝 {t('ticketForm.sections.problemInfo')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    กรุณาอธิบายปัญหาที่พบอย่างละเอียด เพื่อให้ทีมงานสามารถแก้ไขได้อย่างถูกต้อง
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label htmlFor="problemType" className="form-label">
                  {t('ticketForm.fields.problemType.label')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="problemType"
                  {...register('problemType')}
                  className="form-input"
                  aria-describedby={errors.problemType ? 'problemType-error' : undefined}
                >
                  <option value="">{t('ticketForm.fields.problemType.placeholder')}</option>
                  <option value="ฮาร์ดแวร์">{t('ticketForm.categories.hardware')}</option>
                  <option value="ซอฟต์แวร์">{t('ticketForm.categories.software')}</option>
                  <option value="เครือข่าย">{t('ticketForm.categories.network')}</option>
                  <option value="เครื่องพิมพ์">{t('ticketForm.categories.printer')}</option>
                  <option value="โทรศัพท์">{t('ticketForm.categories.phone')}</option>
                  <option value="อีเมล">{t('ticketForm.categories.email')}</option>
                  <option value="ระบบงาน">{t('ticketForm.categories.system')}</option>
                  <option value="ไวรัส">{t('ticketForm.categories.virus')}</option>
                  <option value="สำรองข้อมูล">{t('ticketForm.categories.backup')}</option>
                  <option value="การอบรม">{t('ticketForm.categories.training')}</option>
                  <option value="อื่นๆ">{t('ticketForm.categories.others')}</option>
                </select>
                {errors.problemType && (
                  <p id="problemType-error" className="form-error" role="alert">
                    {t('ticketForm.errors.problemTypeRequired')}
                  </p>
                )}
              </div>

              {watchProblemType === 'อื่นๆ' && (
                <div className="animate-slide-up">
                  <label htmlFor="otherProblemType" className="form-label">
                    {t('ticketForm.fields.otherProblemType.label')}
                  </label>
                  <input
                    type="text"
                    id="otherProblemType"
                    {...register('otherProblemType')}
                    className="form-input"
                    placeholder={t('ticketForm.fields.otherProblemType.placeholder')}
                  />
                </div>
              )}

              <div>
                <label htmlFor="problemDescription" className="form-label">
                  {t('ticketForm.fields.problemDescription.label')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="problemDescription"
                  {...register('problemDescription')}
                  rows={4}
                  className="form-input resize-none"
                  placeholder={t('ticketForm.fields.problemDescription.placeholder')}
                  aria-describedby={errors.problemDescription ? 'problemDescription-error' : undefined}
                />
                {errors.problemDescription && (
                  <p id="problemDescription-error" className="form-error" role="alert">
                    {t('ticketForm.errors.descriptionMinLength')}
                  </p>
                )}
              </div>

              {/* File Upload Section - Temporarily disabled */}
              {/* <div>
                <label className="form-label">
                  แนบไฟล์รูปภาพประกอบ (ถ้ามี)
                </label>
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={3}
                  maxSize={10}
                  acceptedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt']}
                  disabled={isSubmitting}
                />
              </div> */}
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('ticketForm.sections.contactInfo')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ข้อมูลสำหรับการติดต่อกลับ</p>
                </div>
              </div>
            </div>
            <div className="card-body space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="form-label">
                    {t('ticketForm.fields.fullName.label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    {...register('fullName')}
                    className="form-input"
                    placeholder={t('ticketForm.fields.fullName.placeholder')}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="form-error" role="alert">
                      {t('ticketForm.errors.nameMinLength')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="form-label">
                    {t('ticketForm.fields.phoneNumber.label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register('phoneNumber')}
                    className="form-input"
                    placeholder={t('ticketForm.fields.phoneNumber.placeholder')}
                    aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
                  />
                  {errors.phoneNumber && (
                    <p id="phoneNumber-error" className="form-error" role="alert">
                      {t('ticketForm.errors.phoneInvalid')}
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ข้อมูลหน่วยงาน */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('ticketForm.sections.organizationInfo')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ข้อมูลหน่วยงานและครุภัณฑ์</p>
                </div>
              </div>
            </div>
            <div className="card-body space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="department" className="form-label">
                    {t('ticketForm.fields.department.label')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    {...register('department')}
                    className="form-input"
                    aria-describedby={errors.department ? 'department-error' : undefined}
                  >
                    <option value="">{t('ticketForm.fields.department.placeholder')}</option>
                    <option value="สลก.">สลก. - สำนักงานเลขานุการกรม</option>
                    <option value="กยผ.">กยผ. - กองยุทธศาสตร์และแผนงาน</option>
                    <option value="กสค.">กสค. - กองส่งเสริมสถาบันครอบครัว</option>
                    <option value="กสพ.">กสพ. - กองส่งเสริมความเสมอภาคระหว่างเพศ</option>
                    <option value="กคอ.">กคอ. - กองคุ้มครองและพัฒนาอาชีพ</option>
                    <option value="ศจท.">ศจท. - ศูนย์ส่งเสริมจริยธรรมและต่อต้านการทุจริต</option>
                    <option value="กพร.">กพร. - กลุ่มพัฒนาระบบบริหาร</option>
                    <option value="ตสน.">ตสน. - กลุ่มตรวจสอบภายใน</option>
                  </select>
                  {errors.department && (
                    <p id="department-error" className="form-error" role="alert">
                      {t('ticketForm.errors.departmentRequired')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="division" className="form-label">
                    {t('ticketForm.fields.division.label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="division"
                    {...register('division')}
                    className="form-input"
                    placeholder={t('ticketForm.fields.division.placeholder')}
                    aria-describedby={errors.division ? 'division-error' : undefined}
                  />
                  {errors.division && (
                    <p id="division-error" className="form-error" role="alert">
                      {t('ticketForm.errors.divisionRequired')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="assetNumber" className="form-label">
                  {t('ticketForm.fields.assetNumber.label')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="assetNumber"
                  {...register('assetNumber')}
                  className="form-input"
                  placeholder={t('ticketForm.fields.assetNumber.placeholder')}
                  aria-describedby={errors.assetNumber ? 'assetNumber-error' : undefined}
                />
                {errors.assetNumber && (
                  <p id="assetNumber-error" className="form-error" role="alert">
                    {errors.assetNumber.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rate Limit Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">{t('ticketForm.rateLimit.title')}</p>
                <p>{t('ticketForm.rateLimit.description')}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('ticketForm.submit.loading')}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>{t('ticketForm.submit.button')}</span>
                </div>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default TicketFormPage;