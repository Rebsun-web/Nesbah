'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container } from '@/components/container'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import BusinessUserViewModal from './BusinessUserViewModal'
import BankUserViewModal from './BankUserViewModal'
import EditUserModal from './EditUserModal'
import CreateBusinessUserForm from './CreateBusinessUserForm'
import CreateBankUserForm from './CreateBankUserForm'
import CreateBankEmployeeForm from './CreateBankEmployeeForm'

export default function UserManagement() {
    const [activeTab, setActiveTab] = useState('businesses')
    const [businessUsers, setBusinessUsers] = useState([])
    const [bankUsers, setBankUsers] = useState([])
    const [bankEmployees, setBankEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Form states
    const [showCreateBusinessForm, setShowCreateBusinessForm] = useState(false)
    const [showCreateBankForm, setShowCreateBankForm] = useState(false)
    const [showCreateEmployeeForm, setShowCreateEmployeeForm] = useState(false)
    
    // CRUD operation states
    const [selectedUser, setSelectedUser] = useState(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [deletingUser, setDeletingUser] = useState(null)
    const [passwordUser, setPasswordUser] = useState(null)
    const [customPassword, setCustomPassword] = useState('')
    const [passwordAction, setPasswordAction] = useState('reset') // 'reset' or 'custom'

    const fetchAllUsers = useCallback(async () => {
        try {
            setLoading(true)
            
            // Fetch business users
            const businessResponse = await fetch('/api/admin/users/business', {
                credentials: 'include'
            })
            if (businessResponse.ok) {
                const businessData = await businessResponse.json()
                console.log('🔍 Business users API response:', businessData)
                console.log('🔍 Business users data:', businessData.data?.users)
                setBusinessUsers(businessData.data?.users || [])
            } else {
                console.error('❌ Business users API error:', businessResponse.status, businessResponse.statusText)
            }

            // Fetch bank users
            const bankResponse = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            })
            if (bankResponse.ok) {
                const bankData = await bankResponse.json()
                setBankUsers(bankData.banks || [])
            }

            // Fetch bank employees
            const employeeResponse = await fetch('/api/admin/users/bank-employees', {
                credentials: 'include'
            })
            if (employeeResponse.ok) {
                const employeeData = await employeeResponse.json()
                setBankEmployees(employeeData.employees || [])
            }

            setError(null)
            console.log('🔍 All users fetched successfully')
            console.log('🔍 Business users count:', businessUsers.length)
            console.log('🔍 Bank users count:', bankUsers.length)
            console.log('🔍 Bank employees count:', bankEmployees.length)
        } catch (error) {
            console.error('Error fetching users:', error)
            setError('Network error while fetching users')
        } finally {
            setLoading(false)
        }
    }, [businessUsers.length, bankUsers.length, bankEmployees.length])

    useEffect(() => {
        fetchAllUsers()
    }, [fetchAllUsers])



    const handleBusinessUserCreated = (userData) => {
        setShowCreateBusinessForm(false)
        fetchAllUsers()
        alert('Business user created successfully!')
    }

    const handleBankUserCreated = (userData) => {
        setShowCreateBankForm(false)
        fetchAllUsers()
        alert('Bank user created successfully!')
    }

    const handleBankEmployeeCreated = (employeeData) => {
        setShowCreateEmployeeForm(false)
        fetchAllUsers()
        alert('Bank employee created successfully!')
    }

    const handleUserAction = async (userId, action, userType, updateData = {}) => {
        try {
            let endpoint = ''
            let requestBody = {}

            if (userType === 'employee') {
                endpoint = '/api/admin/users/bank-employees'
                requestBody = {
                    employee_id: userId,
                    action,
                    ...updateData
                }
            } else if (userType === 'business') {
                endpoint = `/api/admin/users/business/${userId}`
                requestBody = {
                    ...updateData
                }
            } else {
                // For bank users, we'll need to implement similar endpoints
                console.log('Action handling for bank users not yet implemented')
                return
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            if (response.ok && data.success) {
                fetchAllUsers()
                alert(`User ${action} successfully!`)
            } else {
                alert(data.error || `Failed to ${action} user`)
            }
        } catch (error) {
            console.error(`Error ${action} user:`, error)
            alert(`Network error while ${action} user`)
        }
    }



    const openCreateBusinessForm = () => {
        setShowCreateBusinessForm(true)
    }

    const openCreateBankForm = () => {
        setShowCreateBankForm(true)
    }

    const openCreateEmployeeForm = () => {
        setShowCreateEmployeeForm(true)
    }

    // CRUD Operations
    const handleViewUser = (user, userType) => {
        setSelectedUser({ ...user, userType })
        setShowViewModal(true)
    }

    const handleEditUser = (user, userType) => {
        console.log('🔧 handleEditUser called with:', { user, userType })
        setEditingUser({ ...user, userType })
        setShowEditModal(true)
    }

    const handleDeleteUser = (user, userType) => {
        setDeletingUser({ ...user, userType })
        setShowDeleteModal(true)
    }

    const confirmDeleteUser = async () => {
        if (!deletingUser) return

        try {
            let endpoint = ''
            let requestBody = {}

            if (deletingUser.userType === 'business') {
                endpoint = `/api/admin/users/business/${deletingUser.user_id}`
                requestBody = {}
            } else if (deletingUser.userType === 'bank') {
                endpoint = '/api/admin/users/delete-bank'
                requestBody = { user_id: deletingUser.user_id }
            } else if (deletingUser.userType === 'employee') {
                endpoint = '/api/admin/users/delete-bank-employee'
                requestBody = { employee_id: deletingUser.employee_id }
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setShowDeleteModal(false)
                setDeletingUser(null)
                fetchAllUsers()
                
                // Show detailed success message with deletion summary
                let successMessage = `${deletingUser.userType.charAt(0).toUpperCase() + deletingUser.userType.slice(1)} user deleted successfully!`;
                
                if (data.deletedData) {
                    if (deletingUser.userType === 'business') {
                        successMessage += `\n\nDeletion Summary:\n`;
                        successMessage += `• Business user: ✓\n`;
                        successMessage += `• User account: ✓\n`;
                        successMessage += `• Applications: ${data.deletedData.applications}\n`;
                        successMessage += `• Offers: ${data.deletedData.offers}`;
                    } else if (deletingUser.userType === 'bank') {
                        successMessage += `\n\nDeletion Summary:\n`;
                        successMessage += `• Bank user: ✓\n`;
                        successMessage += `• User account: ✓\n`;
                        successMessage += `• Employees: ${data.deletedData.employees}\n`;
                        successMessage += `• Offers: ${data.deletedData.offers}`;
                    } else if (deletingUser.userType === 'employee') {
                        successMessage += `\n\nDeletion Summary:\n`;
                        successMessage += `• Bank employee: ✓\n`;
                        successMessage += `• User account: ✓`;
                    }
                }
                
                alert(successMessage)
            } else {
                alert(data.error || `Failed to delete ${deletingUser.userType} user`)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert(`Network error while deleting ${deletingUser.userType} user`)
        }
    }

    const handleUpdateUser = async (updatedData) => {
        if (!editingUser) return

        try {
            let endpoint = ''
            let requestBody = { ...updatedData }

            console.log('🔧 handleUpdateUser called with:', { editingUser, updatedData })

            if (editingUser.userType === 'business') {
                endpoint = `/api/admin/users/business/${editingUser.user_id}`
                requestBody = { ...updatedData }
            } else if (editingUser.userType === 'bank') {
                endpoint = `/api/admin/users/${editingUser.user_id}?user_type=bank`
                requestBody = { ...updatedData }
            } else if (editingUser.userType === 'employee') {
                endpoint = `/api/admin/users/${editingUser.user_id}?user_type=employee`
                requestBody = { ...updatedData }
            }

            console.log('🔧 Making request to:', endpoint)
            console.log('🔧 Request body:', requestBody)

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            })

            console.log('🔧 Response status:', response.status)
            console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()))

            const data = await response.json()
            console.log('🔧 Response data:', data)

            if (response.ok && data.success) {
                setShowEditModal(false)
                setEditingUser(null)
                fetchAllUsers()
                alert(`${editingUser.userType.charAt(0).toUpperCase() + editingUser.userType.slice(1)} user updated successfully!`)
            } else {
                alert(data.error || `Failed to update ${editingUser.userType} user`)
            }
        } catch (error) {
            console.error('Error updating user:', error)
            alert(`Network error while updating ${editingUser.userType} user`)
        }
    }

    const handleResetPassword = async (user, userType) => {
        setPasswordUser({ ...user, userType })
        setPasswordAction('reset')
        setCustomPassword('')
        setShowPasswordModal(true)
    }

    const handleSetCustomPassword = async (user, userType) => {
        setPasswordUser({ ...user, userType })
        setPasswordAction('custom')
        setCustomPassword('')
        setShowPasswordModal(true)
    }

    const handlePasswordAction = async () => {
        if (!passwordUser) return

        if (passwordAction === 'custom' && (!customPassword || customPassword.length < 8)) {
            alert('Custom password must be at least 8 characters long');
            return;
        }

        try {
            let endpoint = '';
            let requestBody = { user_id: passwordUser.user_id };

            if (passwordAction === 'custom') {
                requestBody.custom_password = customPassword;
            }

            if (passwordUser.userType === 'bank') {
                endpoint = '/api/admin/users/reset-bank-password';
            } else if (passwordUser.userType === 'business') {
                endpoint = '/api/admin/users/reset-business-password';
            } else if (passwordUser.userType === 'employee') {
                endpoint = '/api/admin/users/reset-bank-employee-password';
            } else {
                alert('Password management not implemented for this user type');
                return;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const actionText = passwordAction === 'custom' ? 'set' : 'reset';
                alert(`Password ${actionText} successfully!\n\nNew Password: ${data.password}\n\nPlease copy this password and provide it to the user securely.`);
                setShowPasswordModal(false);
                setPasswordUser(null);
                setCustomPassword('');
            } else {
                alert(data.error || `Failed to ${passwordAction} password for ${passwordUser.userType}`);
            }
        } catch (error) {
            console.error('Error managing password:', error);
            alert(`Network error while ${passwordAction} password for ${passwordUser.userType}`);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <Container>
            <div className="py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-gray-600">
                        Manage business users, bank users, and employee accounts
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'businesses', name: 'Business Users', count: businessUsers.length },
                                { id: 'banks', name: 'Bank Users', count: bankUsers.length },
                                { id: 'employees', name: 'Bank Employees', count: bankEmployees.length }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        py-2 px-1 border-b-2 font-medium text-sm
                                        ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    {tab.name}
                                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Create User Buttons - Context Aware */}
                {activeTab === 'businesses' && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-purple-800">Business Users Management</h3>
                                <p className="text-sm text-purple-600 mt-1">Create and manage business user accounts</p>
                            </div>
                            <button
                                                                    onClick={openCreateBusinessForm}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Business User
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-purple-800">Bank Users Management</h3>
                                <p className="text-sm text-purple-600 mt-1">Create and manage bank user accounts</p>
                            </div>
                            <button
                                                                    onClick={openCreateBankForm}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Bank User
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'employees' && (
                                                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-purple-800">Bank Employees Management</h3>
                                        <p className="text-sm text-purple-600 mt-1">Create and manage bank employee accounts with automatic bank linking</p>
                                    </div>
                            <button
                                                                    onClick={openCreateEmployeeForm}
                                className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Bank Employee
                            </button>
                        </div>
                    </div>
                )}

                {/* User Lists */}
                {activeTab === 'businesses' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Business Users</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legal Form</th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {businessUsers.length > 0 ? (
                                        businessUsers.map((user) => (
                                            <tr key={user.user_id}>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.trade_name || user.entity_name || 'N/A'}</td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{user.cr_number || user.cr_national_number || 'N/A'}</td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{user.legal_form || 'N/A'}</td>

                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.cr_capital ? `SAR ${user.cr_capital.toLocaleString()}` : 'N/A'}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewUser(user, 'business')}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View Details"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditUser(user, 'business')}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Edit User"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(user, 'business')}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Reset Password"
                                                        >
                                                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user, 'business')}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete User"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                <div className="text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No business users found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Get started by creating a new business user.
                                                    </p>
                                                    <div className="mt-6">
                                                        <button
                                                            onClick={openCreateBusinessForm}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                        >
                                                            Create Business User
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Bank Users</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bankUsers.map((bank) => (
                                        <tr key={bank.user_id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{bank.entity_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{bank.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {bank.logo_url ? (
                                                    <img 
                                                        src={bank.logo_url} 
                                                        alt="Bank Logo" 
                                                        className="h-8 w-8 rounded object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'inline';
                                                        }}
                                                    />
                                                ) : null}
                                                {(!bank.logo_url || bank.logo_url === '') && (
                                                    <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditUser(bank, 'bank')}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit User"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                                                                            <button
                                                            onClick={() => handleResetPassword(bank, 'bank')}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                            title="Reset Password"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                        </button>
                                                    <button
                                                        onClick={() => handleSetCustomPassword(bank, 'bank')}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Set Custom Password"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(bank, 'bank')}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Bank Employees</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Logo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bankEmployees.map((employee) => (
                                        <tr key={employee.employee_id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{employee.email}</div>
                                                <div className="text-sm text-gray-500">{employee.first_name} {employee.last_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.bank_entity_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.bank_logo_url ? (
                                                    <img 
                                                        src={employee.bank_logo_url} 
                                                        alt="Bank Logo" 
                                                        className="h-8 w-8 rounded object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'inline';
                                                        }}
                                                    />
                                                ) : null}
                                                {(!employee.bank_logo_url || employee.bank_logo_url === '') && (
                                                    <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.position || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.last_login_at ? 
                                                    new Date(employee.last_login_at).toLocaleDateString() : 
                                                    'Never'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewUser(employee, 'employee')}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(employee, 'employee')}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit User"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(employee, 'employee')}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(employee, 'employee')}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Reset Password"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSetCustomPassword(employee, 'employee')}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Set Custom Password"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Business User Form */}
                <CreateBusinessUserForm
                    isOpen={showCreateBusinessForm}
                    onClose={() => setShowCreateBusinessForm(false)}
                    onSuccess={handleBusinessUserCreated}
                />

                {/* View User Modal */}
                {showViewModal && selectedUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        View {selectedUser.userType.charAt(0).toUpperCase() + selectedUser.userType.slice(1)} User
                                    </h3>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <p className="text-sm text-gray-900">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedUser.userType}</p>
                                        </div>
                                        
                                        {selectedUser.userType === 'business' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.entity_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">CR Number</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.cr_number || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.city || 'N/A'}</p>
                                                </div>
                                            </>
                                        )}
                                        
                                        {selectedUser.userType === 'bank' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.entity_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                                                    <p className="text-sm text-gray-900">
                                                        {selectedUser.credit_limit ? 
                                                            `SAR ${parseFloat(selectedUser.credit_limit).toLocaleString()}` : 
                                                            'N/A'
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.contact_person || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.contact_person_number || 'N/A'}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.logo_url || 'N/A'}</p>
                                                    {selectedUser.logo_url && (
                                                        <img 
                                                            src={selectedUser.logo_url} 
                                                            alt="Bank Logo" 
                                                            className="h-16 w-16 rounded object-cover mt-2"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        
                                        {selectedUser.userType === 'employee' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.first_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.last_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.position || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                                                    <p className="text-sm text-gray-900">{selectedUser.bank_entity_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Logo</label>
                                                    {selectedUser.bank_logo_url ? (
                                                        <div className="flex items-center space-x-2">
                                                            <img 
                                                                src={selectedUser.bank_logo_url} 
                                                                alt="Bank Logo" 
                                                                className="h-8 w-8 rounded object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                            <span className="text-sm text-gray-500">Logo loaded</span>
                                                        </div>
                                                    ) : (
                                                        <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                                                    <p className="text-sm text-gray-900">
                                                        {selectedUser.created_at ? 
                                                            new Date(selectedUser.created_at).toLocaleDateString() : 
                                                            'N/A'
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                                                    <p className="text-sm text-gray-900">
                                                        {selectedUser.last_login_at ? 
                                                            new Date(selectedUser.last_login_at).toLocaleDateString() : 
                                                            'Never'
                                                        }
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deletingUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Delete {deletingUser.userType.charAt(0).toUpperCase() + deletingUser.userType.slice(1)} User
                                    </h3>
                                    
                                    {/* Cascade Deletion Warnings */}
                                    {deletingUser.userType === 'business' && (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-left">
                                            <div className="flex">
                                                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-red-800">Cascade Deletion Warning</h4>
                                                    <div className="mt-2 text-sm text-red-700">
                                                        <p>Deleting this business user will also delete:</p>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            <li>All POS applications submitted by this business</li>
                                                            <li>All offers received for their applications</li>
                                                            <li>All related application data and documents</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {deletingUser.userType === 'bank' && (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-left">
                                            <div className="flex">
                                                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-red-800">Cascade Deletion Warning</h4>
                                                    <div className="mt-2 text-sm text-red-700">
                                                        <p>Deleting this bank will also delete:</p>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            <li>All bank employees associated with this bank</li>
                                                            <li>All offers submitted by this bank</li>
                                                            <li>All bank-specific data and configurations</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <p className="text-sm text-gray-500 mb-6">
                                        Are you sure you want to delete this user? This action cannot be undone.
                                        {deletingUser.userType === 'business' || deletingUser.userType === 'bank' ? ' All related data will be permanently removed.' : ''}
                                    </p>
                                </div>

                                <div className="flex justify-center space-x-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteUser}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Delete User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Management Modal */}
                {showPasswordModal && passwordUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {passwordAction === 'reset' ? 'Reset' : 'Set Custom'} Password
                                    </h3>
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                        <div className="flex">
                                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="ml-3">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Password Management:</strong> {passwordAction === 'reset' ? 
                                                        'Generate a new secure password for this user.' : 
                                                        'Set a custom password for this user. Must be at least 8 characters long.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                                        <p className="text-sm text-gray-900">
                                            {passwordUser.email} ({passwordUser.userType === 'bank' ? 'Bank' : 'Bank Employee'})
                                        </p>
                                    </div>

                                    {passwordAction === 'custom' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Custom Password *
                                            </label>
                                            <input
                                                type="text"
                                                value={customPassword}
                                                onChange={(e) => setCustomPassword(e.target.value)}
                                                placeholder="Enter custom password (min 8 characters)"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                minLength={8}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Password must be at least 8 characters long
                                            </p>
                                        </div>
                                    )}

                                    {passwordAction === 'reset' && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                            <div className="flex">
                                                <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700">
                                                        <strong>Note:</strong> A new secure 16-character password will be generated automatically. 
                                                        Make sure to copy and provide it to the user securely.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePasswordAction}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {passwordAction === 'reset' ? 'Reset Password' : 'Set Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                <EditUserModal
                    user={editingUser}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleUpdateUser}
                />

                {/* Business User View Modal */}
                <BusinessUserViewModal
                    user={selectedUser}
                    isOpen={showViewModal && selectedUser?.userType === 'business'}
                    onClose={() => setShowViewModal(false)}
                />

                {/* Bank User View Modal */}
                <BankUserViewModal
                    user={selectedUser}
                    isOpen={showViewModal && selectedUser?.userType === 'bank'}
                    onClose={() => setShowViewModal(false)}
                />

                {/* Create Bank User Modal */}
                <CreateBankUserForm
                    isOpen={showCreateBankForm}
                    onClose={() => setShowCreateBankForm(false)}
                    onSuccess={handleBankUserCreated}
                />

                {/* Create Bank Employee Modal */}
                <CreateBankEmployeeForm
                    isOpen={showCreateEmployeeForm}
                    onClose={() => setShowCreateEmployeeForm(false)}
                    onSuccess={handleBankEmployeeCreated}
                />
            </div>
        </Container>
    )
}
