import React, { useState } from 'react';
import { SearchIcon, FilterIcon, XIcon, CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchFilters {
  keyword: string;
  status: string;
  priority: string;
  problemType: string;
  department: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}

interface Props {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  loading?: boolean;
  results?: number;
}

const AdvancedSearch: React.FC<Props> = ({ onSearch, onReset, loading, results }) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    status: '',
    priority: '',
    problemType: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: ''
  });

  const statusOptions = [
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: 'text-yellow-600' },
    { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', color: 'text-blue-600' },
    { value: 'รอข้อมูลเพิ่มเติม', label: 'รอข้อมูลเพิ่มเติม', color: 'text-orange-600' },
    { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น', color: 'text-green-600' }
  ];

  const priorityOptions = [
    { value: 'วิกฤต', label: 'วิกฤต', color: 'text-red-600' },
    { value: 'สูง', label: 'สูง', color: 'text-orange-600' },
    { value: 'ปกติ', label: 'ปกติ', color: 'text-blue-600' },
    { value: 'ต่ำ', label: 'ต่ำ', color: 'text-gray-600' }
  ];

  const problemTypeOptions = [
    { value: 'ฮาร์ดแวร์', label: 'ฮาร์ดแวร์' },
    { value: 'ซอฟต์แวร์', label: 'ซอฟต์แวร์' },
    { value: 'เครือข่าย', label: 'เครือข่าย' },
    { value: 'เครื่องพิมพ์', label: 'เครื่องพิมพ์' },
    { value: 'โทรศัพท์', label: 'โทรศัพท์' },
    { value: 'อีเมล', label: 'อีเมล' },
    { value: 'ระบบงาน', label: 'ระบบงาน' },
    { value: 'ไวรัส', label: 'ไวรัส' },
    { value: 'สำรองข้อมูล', label: 'สำรองข้อมูล' },
    { value: 'การอบรม', label: 'การอบรม' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
  ];

  const departmentOptions = [
    { value: 'สลก.', label: 'สลก.' },
    { value: 'กยผ.', label: 'กยผ.' },
    { value: 'กสค.', label: 'กสค.' },
    { value: 'กสพ.', label: 'กสพ.' },
    { value: 'กคอ.', label: 'กคอ.' },
    { value: 'ศจท.', label: 'ศจท.' },
    { value: 'กพร.', label: 'กพร.' },
    { value: 'ตสน.', label: 'ตสน.' }
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      status: '',
      priority: '',
      problemType: '',
      department: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: ''
    });
    setShowAdvanced(false);
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="space-y-4">
        {/* Basic Search */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('search.searchPlaceholder')}
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors flex items-center space-x-2 ${
              showAdvanced 
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FilterIcon className="h-5 w-5" />
            <span className="hidden md:inline">{t('search.advancedFilters.title')}</span>
          </button>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SearchIcon className="h-5 w-5" />
            )}
            <span className="hidden md:inline">{t('search.advancedFilters.searchButton')}</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 animate-slide-up">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('search.advancedFilters.allStatus')}</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.priority')}
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('search.advancedFilters.allPriority')}</option>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Problem Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.problemType')}
                </label>
                <select
                  value={filters.problemType}
                  onChange={(e) => handleFilterChange('problemType', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('search.advancedFilters.allProblemType')}</option>
                  {problemTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.department')}
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('search.advancedFilters.allDepartment')}</option>
                  {departmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.dateFrom')}
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('search.advancedFilters.dateTo')}
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {results !== undefined && (
                  <span>{t('search.advancedFilters.foundResults', { count: results })}</span>
                )}
              </div>
              
              <div className="flex space-x-3">
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <XIcon className="h-4 w-4" />
                    <span>{t('search.advancedFilters.resetButton')}</span>
                  </button>
                )}
                
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {t('search.advancedFilters.searchButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {filters.keyword && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                {t('search.advancedFilters.keywordLabel')}: "{filters.keyword}"
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                {t('search.advancedFilters.statusLabel')}: {filters.status}
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                {t('search.advancedFilters.priorityLabel')}: {filters.priority}
              </span>
            )}
            {filters.problemType && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {t('search.advancedFilters.problemTypeLabel')}: {filters.problemType}
              </span>
            )}
            {filters.department && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {t('search.advancedFilters.departmentLabel')}: {filters.department}
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                {t('search.advancedFilters.dateRangeLabel')}: {filters.dateFrom} - {filters.dateTo}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;