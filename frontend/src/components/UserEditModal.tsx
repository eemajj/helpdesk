import React, { useState, useEffect } from 'react';
import { User } from '../types/User';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
  user: User | null;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<User>({ 
    fullName: '', email: '', position: '', role: 'user', isActive: true, username: '' 
  });

  const isNewUser = !user?.id;

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({ fullName: '', email: '', position: '', role: 'user', isActive: true, username: '', password: '' });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{isNewUser ? 'Create New User' : 'Edit User'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          {isNewUser && (
            <>
                <div className="mb-4">
                    <label className="block text-gray-700">Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full p-2 border rounded" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" required />
                </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700">Position</label>
            <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="user">User</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Status</label>
            <select name="isActive" value={String(formData.isActive)} onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.value === 'true'}))} className="w-full p-2 border rounded">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;