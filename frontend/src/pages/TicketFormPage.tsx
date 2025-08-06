import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
// import FileUpload from '../components/FileUpload';

const ProblemType = z.enum([
  'คอมพิวเตอร์',
  'อินเทอร์เน็ต',
  'ปริ้นเตอร์',
  'ระบบสารสนเทศ',
  'ติดตั้ง',
  'อื่น ๆ'
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
  phoneNumber: z.string().regex(/^[0-9]{9,10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'),
  department: Department,
  division: z.string().min(1, 'กรุณาระบุกลุ่ม/ฝ่าย'),
  assetNumber: z.string().min(1, 'กรุณาระบุหมายเลขครุภัณฑ์')
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

  // const handleFilesUploaded = (files: UploadedFile[]) => {
  //   setUploadedFiles(files);
  // };


  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/tickets', data);
      
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
      const errorMessage = error.response?.data?.error || t('messages.submitError');
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
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="card">
            <div className="card-body py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('ticketForm.success.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('ticketForm.success.ticketId')}
              </p>
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
                <code className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {ticketId}
                </code>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('ticketForm.success.saveCode')}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleNewTicket}
                  className="btn-primary w-full"
                >
                  {t('ticketForm.success.newTicket')}
                </button>
                <a
                  href="/track"
                  className="btn-secondary w-full"
                >
                  {t('ticketForm.success.trackTicket')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('ticketForm.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('ticketForm.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
          {/* ข้อมูลปัญหา */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ticketForm.sections.problemInfo')}
              </h2>
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
                  <option value="คอมพิวเตอร์">{t('ticketForm.fields.problemType.options.computer')}</option>
                  <option value="อินเทอร์เน็ต">{t('ticketForm.fields.problemType.options.internet')}</option>
                  <option value="ปริ้นเตอร์">{t('ticketForm.fields.problemType.options.printer')}</option>
                  <option value="ระบบสารสนเทศ">{t('ticketForm.fields.problemType.options.information')}</option>
                  <option value="ติดตั้ง">{t('ticketForm.fields.problemType.options.installation')}</option>
                  <option value="อื่น ๆ">{t('ticketForm.fields.problemType.options.others')}</option>
                </select>
                {errors.problemType && (
                  <p id="problemType-error" className="form-error" role="alert">
                    {t('ticketForm.errors.problemTypeRequired')}
                  </p>
                )}
              </div>

              {watchProblemType === 'อื่น ๆ' && (
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ticketForm.sections.contactInfo')}
              </h2>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ticketForm.sections.organizationInfo')}
              </h2>
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
  );
};

export default TicketFormPage;