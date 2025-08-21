/**
 * 🛠️ Admin Settings Page
 * DWF Helpdesk - Phase 1: Ticket System Configuration
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import {
  Settings,
  Tag,
  AlertTriangle,
  GitBranch,
  Building,
  Mail,
  Users,
  Shield,
  Palette,
  BarChart3,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Trash2,
  Save,
  X,
  CheckCircle
} from 'lucide-react';

// Tab types for Admin Settings
type AdminSettingsTab = 
  | 'ticket-system' 
  | 'organization' 
  | 'system-config' 
  | 'user-management' 
  | 'reports' 
  | 'security' 
  | 'customization';

interface SettingsTabConfig {
  id: AdminSettingsTab;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  badge?: string;
}

const AdminSettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>('ticket-system');

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  const settingsTabs: SettingsTabConfig[] = [
    {
      id: 'ticket-system',
      title: 'ระบบ Ticket',
      description: 'จัดการหมวดหมู่ ระดับความสำคัญ และสถานะ',
      icon: <Tag className="w-5 h-5" />,
      available: true,
      badge: 'Phase 1'
    },
    {
      id: 'organization',
      title: 'ข้อมูลองค์กร',
      description: 'ข้อมูลบริษัท หน่วยงาน และโครงสร้าง',
      icon: <Building className="w-5 h-5" />,
      available: false,
      badge: 'Phase 2'
    },
    {
      id: 'system-config',
      title: 'การตั้งค่าระบบ',
      description: 'อีเมล การแจ้งเตือน SLA และเวลาทำการ',
      icon: <Settings className="w-5 h-5" />,
      available: false,
      badge: 'Phase 3'
    },
    {
      id: 'user-management',
      title: 'จัดการผู้ใช้',
      description: 'บทบาท สิทธิ์ และกลุ่มผู้ใช้',
      icon: <Users className="w-5 h-5" />,
      available: false,
      badge: 'Phase 4'
    },
    {
      id: 'reports',
      title: 'รายงาน',
      description: 'แม่แบบรายงาน และการวิเคราะห์',
      icon: <BarChart3 className="w-5 h-5" />,
      available: false,
      badge: 'Phase 5'
    },
    {
      id: 'security',
      title: 'ความปลอดภัย',
      description: 'นโยบาย ตรวจสอบ และการสำรอง',
      icon: <Shield className="w-5 h-5" />,
      available: false,
      badge: 'Phase 6'
    },
    {
      id: 'customization',
      title: 'ปรับแต่งหน้าตา',
      description: 'ธีม สี และการแสดงผล',
      icon: <Palette className="w-5 h-5" />,
      available: false,
      badge: 'Phase 7'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ticket-system':
        return <TicketSystemSettings />;
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Settings className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              กำลังพัฒนา...
            </h3>
            <p className="text-gray-500">
              ฟีเจอร์นี้จะพร้อมใช้งานในเฟสถัดไป
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                การตั้งค่าระบบ
              </h1>
              <p className="text-gray-600 mt-1">
                จัดการและปรับแต่งระบบ DWF Helpdesk
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-80 space-y-1">
            <nav className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-4 px-2">
                หมวดหมู่การตั้งค่า
              </h3>
              <div className="space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => tab.available && setActiveTab(tab.id)}
                    disabled={!tab.available}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : tab.available
                        ? 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        : 'text-gray-400 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 ${
                        activeTab === tab.id ? 'text-primary-600' : 
                        tab.available ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        {tab.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            activeTab === tab.id ? 'text-primary-900' : 
                            tab.available ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {tab.title}
                          </p>
                          {tab.badge && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              tab.available 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${
                          activeTab === tab.id ? 'text-primary-600' :
                          tab.available ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* Phase Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    การพัฒนาแบบเฟส
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    ฟีเจอร์จะถูกเปิดใช้งานทีละเฟสเพื่อความเสถียร
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket System Settings Component (Phase 1)
const TicketSystemSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'categories' | 'priorities' | 'statuses'>('categories');

  const sections = [
    {
      id: 'categories' as const,
      title: 'หมวดหมู่ปัญหา',
      description: 'จัดการหมวดหมู่ประเภทปัญหา',
      icon: <Tag className="w-5 h-5" />
    },
    {
      id: 'priorities' as const,
      title: 'ระดับความสำคัญ',
      description: 'กำหนด SLA และระดับความสำคัญ',
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      id: 'statuses' as const,
      title: 'สถานะ Ticket',
      description: 'จัดการ workflow สถานะ',
      icon: <GitBranch className="w-5 h-5" />
    }
  ];

  return (
    <div className="p-6">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ระบบ Ticket
        </h2>
        <p className="text-gray-600">
          จัดการหมวดหมู่ ระดับความสำคัญ และสถานะของ Ticket
        </p>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              <span className={`mr-2 ${
                activeSection === section.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
              }`}>
                {section.icon}
              </span>
              {section.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeSection === 'categories' && <CategoriesManagement />}

        {activeSection === 'priorities' && <PrioritiesManagement />}

        {activeSection === 'statuses' && <StatusWorkflowManagement />}
      </div>
    </div>
  );
};

// Categories Management Component  
interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Priorities Management Component
interface Priority {
  id: number;
  name: string;
  level: number;
  description?: string;
  slaMinutes: number; // Changed from slaHours to slaMinutes
  color?: string;
  isActive: boolean;
}

// Status Workflow Management Component
interface TicketStatus {
  id: number;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  allowTransitions: string[]; // Status IDs that this status can transition to
}

const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        // Transform data to match Category interface
        const categoriesData = data.categories.map((cat: any, index: number) => ({
          ...cat,
          isActive: true,
          sortOrder: index
        }));
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ name: '', description: '', isActive: true });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '', isActive: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    // For now, simulate save operation
    const newCategory: Category = {
      id: Date.now(), // temporary ID
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
      sortOrder: categories.length
    };

    if (editingId) {
      setCategories(prev => prev.map(cat => 
        cat.id === editingId 
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      setCategories(prev => [...prev, newCategory]);
    }

    handleCancel();
  };

  const toggleActive = (id: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id 
        ? { ...cat, isActive: !cat.isActive }
        : cat
    ));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('คุณแน่ใจที่จะลบหมวดหมู่นี้?')) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            จัดการหมวดหมู่ปัญหา
          </h3>
          <p className="text-gray-600 mt-1">
            เพิ่ม แก้ไข และจัดการหมวดหมู่ประเภทปัญหาต่างๆ
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อหมวดหมู่ *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น ฮาร์ดแวร์, ซอฟต์แวร์"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="คำอธิบายหมวดหมู่"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">เปิดใช้งาน</span>
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">หมวดหมู่ทั้งหมด ({categories.length})</h4>
        </div>

        <div className="divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id} className="p-4">
              {editingId === category.id ? (
                // Edit Form
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSave}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <div>
                      <h5 className="font-medium text-gray-900">{category.name}</h5>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    
                    {/* Action Buttons */}
                    <button
                      onClick={() => toggleActive(category.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={category.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีหมวดหมู่</h3>
            <p className="text-gray-500">เริ่มต้นด้วยการเพิ่มหมวดหมู่ปัญหาแรก</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Priorities Management Component
const PrioritiesManagement: React.FC = () => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    description: '',
    slaMinutes: 60, // Default 1 hour = 60 minutes
    color: '#16a34a',
    isActive: true
  });

  // Load priorities
  useEffect(() => {
    loadPriorities();
  }, []);

  const loadPriorities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/priorities');
      const data = await response.json();
      if (data.success) {
        // Transform data to match Priority interface
        const prioritiesData = data.priorities.map((pri: any) => ({
          ...pri,
          slaMinutes: pri.slaHours ? pri.slaHours * 60 : 60, // Convert hours to minutes
          isActive: true
        }));
        setPriorities(prioritiesData);
      }
    } catch (error) {
      console.error('Error loading priorities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      level: Math.max(...priorities.map(p => p.level), 0) + 1,
      description: '',
      slaMinutes: 60, // Default 1 hour
      color: '#16a34a',
      isActive: true
    });
  };

  const handleEdit = (priority: Priority) => {
    setEditingId(priority.id);
    setFormData({
      name: priority.name,
      level: priority.level,
      description: priority.description || '',
      slaMinutes: priority.slaMinutes,
      color: priority.color || '#16a34a',
      isActive: priority.isActive
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      level: 1,
      description: '',
      slaMinutes: 60,
      color: '#16a34a',
      isActive: true
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    const newPriority: Priority = {
      id: Date.now(),
      name: formData.name,
      level: formData.level,
      description: formData.description,
      slaMinutes: formData.slaMinutes,
      color: formData.color,
      isActive: formData.isActive
    };

    if (editingId) {
      setPriorities(prev => prev.map(pri => 
        pri.id === editingId 
          ? { ...pri, ...formData }
          : pri
      ));
    } else {
      setPriorities(prev => [...prev, newPriority].sort((a, b) => b.level - a.level));
    }

    handleCancel();
  };

  const toggleActive = (id: number) => {
    setPriorities(prev => prev.map(pri => 
      pri.id === id 
        ? { ...pri, isActive: !pri.isActive }
        : pri
    ));
  };

  const handleDelete = (id: number) => {
    if (window.confirm('คุณแน่ใจที่จะลบระดับความสำคัญนี้?')) {
      setPriorities(prev => prev.filter(pri => pri.id !== id));
    }
  };

  const formatSLA = (minutes: number): string => {
    if (minutes < 60) return `${minutes} นาที`;
    if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) return `${hours} ชั่วโมง`;
      return `${hours} ชั่วโมง ${remainingMinutes} นาที`;
    }
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    const remainingMinutes = minutes % 60;
    
    let result = `${days} วัน`;
    if (remainingHours > 0) result += ` ${remainingHours} ชั่วโมง`;
    if (remainingMinutes > 0) result += ` ${remainingMinutes} นาที`;
    return result;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            จัดการระดับความสำคัญ
          </h3>
          <p className="text-gray-600 mt-1">
            กำหนด SLA, สี และระดับความสำคัญของ Ticket
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มระดับใหม่</span>
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อระดับ *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น วิกฤต, เร่งด่วน"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับ (ตัวเลข) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SLA (นาที) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.slaMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, slaMinutes: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น 60 (1 ชั่วโมง), 1440 (1 วัน)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สี
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="#16a34a"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="คำอธิบายระดับความสำคัญ"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">เปิดใช้งาน</span>
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priorities List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">ระดับความสำคัญทั้งหมด ({priorities.length})</h4>
        </div>

        <div className="divide-y divide-gray-200">
          {priorities.map((priority) => (
            <div key={priority.id} className="p-4">
              {editingId === priority.id ? (
                // Edit Form (Similar to create form but more compact)
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ชื่อระดับ"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ระดับ"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.slaMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, slaMinutes: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SLA (นาที)"
                    />
                  </div>
                  <div className="lg:col-span-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">สี:</span>
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSave}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: priority.color }}
                    ></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{priority.name}</h5>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Level {priority.level}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">
                          SLA: {formatSLA(priority.slaMinutes)}
                        </p>
                        {priority.description && (
                          <p className="text-sm text-gray-500">{priority.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priority.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {priority.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    
                    {/* Action Buttons */}
                    <button
                      onClick={() => toggleActive(priority.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={priority.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {priority.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(priority)}
                      className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(priority.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {priorities.length === 0 && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีระดับความสำคัญ</h3>
            <p className="text-gray-500">เริ่มต้นด้วยการเพิ่มระดับความสำคัญแรก</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Status Workflow Management Component
const StatusWorkflowManagement: React.FC = () => {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    isActive: true,
    isDefault: false,
    allowTransitions: [] as string[]
  });

  // Default Thai statuses
  const defaultStatuses: TicketStatus[] = [
    {
      id: 1,
      name: 'รอดำเนินการ',
      description: 'Ticket ใหม่ที่รอการดำเนินการ',
      color: '#f59e0b',
      isActive: true,
      isDefault: true,
      sortOrder: 1,
      allowTransitions: ['2', '3', '5']
    },
    {
      id: 2,
      name: 'กำลังดำเนินการ',
      description: 'กำลังแก้ไขปัญหา',
      color: '#3b82f6',
      isActive: true,
      isDefault: false,
      sortOrder: 2,
      allowTransitions: ['3', '4', '5']
    },
    {
      id: 3,
      name: 'รอข้อมูลเพิ่มเติม',
      description: 'รอข้อมูลจากผู้แจ้ง',
      color: '#f97316',
      isActive: true,
      isDefault: false,
      sortOrder: 3,
      allowTransitions: ['2', '4', '5']
    },
    {
      id: 4,
      name: 'เสร็จสิ้น',
      description: 'แก้ไขปัญหาเรียบร้อย',
      color: '#10b981',
      isActive: true,
      isDefault: false,
      sortOrder: 4,
      allowTransitions: ['2'] // Can reopen
    },
    {
      id: 5,
      name: 'ยกเลิก',
      description: 'ยกเลิก Ticket',
      color: '#ef4444',
      isActive: true,
      isDefault: false,
      sortOrder: 5,
      allowTransitions: ['1'] // Can reopen
    }
  ];

  // Initialize with default statuses
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStatuses(defaultStatuses);
      setLoading(false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      isActive: true,
      isDefault: false,
      allowTransitions: []
    });
  };

  const handleEdit = (status: TicketStatus) => {
    setEditingId(status.id);
    setFormData({
      name: status.name,
      description: status.description || '',
      color: status.color || '#3b82f6',
      isActive: status.isActive,
      isDefault: status.isDefault,
      allowTransitions: status.allowTransitions
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      isActive: true,
      isDefault: false,
      allowTransitions: []
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    const newStatus: TicketStatus = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      color: formData.color,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
      sortOrder: statuses.length + 1,
      allowTransitions: formData.allowTransitions
    };

    if (editingId) {
      setStatuses(prev => prev.map(status => 
        status.id === editingId 
          ? { ...status, ...formData }
          : status
      ));
    } else {
      setStatuses(prev => [...prev, newStatus]);
    }

    handleCancel();
  };

  const toggleActive = (id: number) => {
    setStatuses(prev => prev.map(status => 
      status.id === id 
        ? { ...status, isActive: !status.isActive }
        : status
    ));
  };

  const toggleDefault = (id: number) => {
    setStatuses(prev => prev.map(status => ({
      ...status,
      isDefault: status.id === id ? !status.isDefault : false // Only one default
    })));
  };

  const handleDelete = (id: number) => {
    const status = statuses.find(s => s.id === id);
    if (status?.isDefault) {
      alert('ไม่สามารถลบสถานะเริ่มต้นได้');
      return;
    }
    
    if (window.confirm('คุณแน่ใจที่จะลบสถานะนี้?')) {
      setStatuses(prev => prev.filter(status => status.id !== id));
    }
  };

  const toggleTransition = (fromStatusId: number, toStatusId: string) => {
    setStatuses(prev => prev.map(status => {
      if (status.id === fromStatusId) {
        const transitions = status.allowTransitions.includes(toStatusId)
          ? status.allowTransitions.filter(t => t !== toStatusId)
          : [...status.allowTransitions, toStatusId];
        return { ...status, allowTransitions: transitions };
      }
      return status;
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            จัดการสถานะ Ticket
          </h3>
          <p className="text-gray-600 mt-1">
            กำหนดสถานะและ workflow การเปลี่ยนสถานะ
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสถานะใหม่</span>
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสถานะ *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น กำลังตรวจสอบ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สี
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="คำอธิบายสถานะ"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">เปิดใช้งาน</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">สถานะเริ่มต้น</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statuses List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">สถานะทั้งหมด ({statuses.length})</h4>
        </div>

        <div className="divide-y divide-gray-200">
          {statuses.map((status) => (
            <div key={status.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-gray-900">{status.name}</h5>
                      {status.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          เริ่มต้น
                        </span>
                      )}
                    </div>
                    {status.description && (
                      <p className="text-sm text-gray-600">{status.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {status.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                  
                  {/* Action Buttons */}
                  <button
                    onClick={() => toggleActive(status.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title={status.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {status.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => toggleDefault(status.id)}
                    className={`p-2 transition-colors ${
                      status.isDefault 
                        ? 'text-blue-600 hover:text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={status.isDefault ? 'ยกเลิกสถานะเริ่มต้น' : 'ตั้งเป็นสถานะเริ่มต้น'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(status)}
                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(status.id)}
                    disabled={status.isDefault}
                    className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title={status.isDefault ? 'ไม่สามารถลบสถานะเริ่มต้นได้' : 'ลบ'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workflow Transitions */}
              <div className="ml-8 pl-4 border-l-2 border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">สามารถเปลี่ยนไปเป็น:</p>
                <div className="flex flex-wrap gap-2">
                  {statuses
                    .filter(s => s.id !== status.id)
                    .map((targetStatus) => (
                    <button
                      key={targetStatus.id}
                      onClick={() => toggleTransition(status.id, targetStatus.id.toString())}
                      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs transition-colors ${
                        status.allowTransitions.includes(targetStatus.id.toString())
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: targetStatus.color }}
                      ></div>
                      <span>{targetStatus.name}</span>
                    </button>
                  ))}
                </div>
                {status.allowTransitions.length === 0 && (
                  <p className="text-xs text-gray-500 italic">ไม่สามารถเปลี่ยนสถานะได้ (สิ้นสุด)</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;