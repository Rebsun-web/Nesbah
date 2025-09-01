'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'

export default function UserManagement() {
    const [activeTab, setActiveTab] = useState('businesses')
    const [businessUsers, setBusinessUsers] = useState([])
    const [bankUsers, setBankUsers] = useState([])
    const [bankEmployees, setBankEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [createFormType, setCreateFormType] = useState('business')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        entity_name: '',
        trade_name: '',
        cr_number: '',
        city: '',
        cr_capital: '',
        contact_person: '',
        contact_person_number: '',
        // Bank specific fields
        sama_license_number: '',
        bank_type: '',
        license_status: '',
        establishment_date: '',
        authorized_capital: '',
        head_office_address: '',
        sama_compliance_status: '',
        number_of_branches: '',
        logo_url: '',
        credit_limit: '',
        // Employee specific fields
        first_name: '',
        last_name: '',
        position: '',
        phone: '',
        bank_user_id: ''
    })

    useEffect(() => {
        fetchAllUsers()
    }, [])

    const fetchAllUsers = async () => {
        try {
            setLoading(true)
            
            // Fetch business users
            const businessResponse = await fetch('/api/admin/users?user_type=business', {
                credentials: 'include'
            })
            if (businessResponse.ok) {
                const businessData = await businessResponse.json()
                setBusinessUsers(businessData.data?.users || [])
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
        } catch (error) {
            console.error('Error fetching users:', error)
            setError('Network error while fetching users')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        
        try {
            let endpoint = ''
            let requestBody = {}

            if (createFormType === 'business') {
                endpoint = '/api/admin/users/create-business'
                requestBody = {
                    email: formData.email,
                    password: formData.password,
                    trade_name: formData.trade_name,
                    cr_number: formData.cr_number,
                    city: formData.city,
                    cr_capital: formData.cr_capital,
                    contact_person: formData.contact_person,
                    contact_person_number: formData.contact_person_number
                }
            } else if (createFormType === 'bank') {
                endpoint = '/api/admin/users/create-bank'
                requestBody = {
                    email: formData.email,
                    password: formData.password,
                    entity_name: formData.entity_name,
                    sama_license_number: formData.sama_license_number,
                    bank_type: formData.bank_type,
                    license_status: formData.license_status,
                    establishment_date: formData.establishment_date,
                    authorized_capital: formData.authorized_capital,
                    head_office_address: formData.head_office_address,
                    sama_compliance_status: formData.sama_compliance_status,
                    number_of_branches: formData.number_of_branches,
                    logo_url: formData.logo_url,
                    credit_limit: formData.credit_limit,
                    contact_person: formData.contact_person,
                    contact_person_number: formData.contact_person_number
                }
            } else if (createFormType === 'employee') {
                endpoint = '/api/admin/users/create-bank-employee'
                requestBody = {
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    position: formData.position,
                    phone: formData.phone,
                    bank_user_id: formData.bank_user_id
                }
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setShowCreateForm(false)
                resetForm()
                fetchAllUsers()
                alert(`${createFormType.charAt(0).toUpperCase() + createFormType.slice(1)} user created successfully!`)
            } else {
                alert(data.error || `Failed to create ${createFormType} user`)
            }
        } catch (error) {
            console.error('Error creating user:', error)
            alert(`Network error while creating ${createFormType} user`)
        }
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
            } else {
                // For business and bank users, we'll need to implement similar endpoints
                console.log('Action handling for business/bank users not yet implemented')
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

    const handleViewUser = (user, userType) => {
        // For now, we'll show the user details in an alert
        // In a real application, you might want to show a modal or navigate to a detail page
        let details = `User Type: ${userType}\n`
        details += `Email: ${user.email}\n`
        
        if (userType === 'business') {
            details += `Trade Name: ${user.entity_name}\n`
            details += `CR Number: ${user.cr_number || 'N/A'}\n`
            details += `City: ${user.city || 'N/A'}\n`
            details += `Contact Person: ${user.contact_person || 'N/A'}`
        } else if (userType === 'bank') {
            details += `Entity Name: ${user.entity_name}\n`
            details += `SAMA License: ${user.sama_license_number || 'N/A'}\n`
            details += `Bank Type: ${user.bank_type || 'N/A'}`
        } else if (userType === 'employee') {
            details += `Name: ${user.first_name} ${user.last_name}\n`
            details += `Position: ${user.position || 'N/A'}\n`
            details += `Phone: ${user.phone || 'N/A'}`
        }
        
        alert(details)
    }

    const handleEditUser = (user, userType) => {
        // Set form data for editing
        setFormData({
            email: user.email || '',
            password: '', // Don't pre-fill password for security
            entity_name: user.entity_name || '',
            trade_name: user.trade_name || '',
            cr_number: user.cr_number || '',
            city: user.city || '',
            cr_capital: user.cr_capital || '',
            contact_person: user.contact_person || '',
            contact_person_number: user.contact_person_number || '',
            sama_license_number: user.sama_license_number || '',
            bank_type: user.bank_type || '',
            establishment_date: user.establishment_date || '',
            authorized_capital: user.authorized_capital || '',
            head_office_address: user.head_office_address || '',
            sama_compliance_status: user.sama_compliance_status || '',
            number_of_branches: user.number_of_branches || '',
            logo_url: user.logo_url || '',
            credit_limit: user.credit_limit || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            position: user.position || '',
            phone: user.phone || '',
            bank_user_id: user.bank_user_id || ''
        })
        setCreateFormType(userType)
        setShowCreateForm(true)
    }

    const handleDeleteUser = async (userId, userType) => {
        if (!confirm(`Are you sure you want to delete this ${userType} user?`)) {
            return
        }

        try {
            let endpoint = ''
            let requestBody = {}

            if (userType === 'employee') {
                endpoint = '/api/admin/users/bank-employees'
                requestBody = {
                    employee_id: userId,
                    action: 'delete'
                }
            } else {
                // For business and bank users, we'll need to implement similar endpoints
                console.log('Delete handling for business/bank users not yet implemented')
                return
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            if (response.ok && data.success) {
                fetchAllUsers()
                alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} user deleted successfully!`)
            } else {
                alert(data.error || `Failed to delete ${userType} user`)
            }
        } catch (error) {
            console.error(`Error deleting ${userType} user:`, error)
            alert(`Network error while deleting ${userType} user`)
        }
    }

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            entity_name: '',
            trade_name: '',
            cr_number: '',
            city: '',
            cr_capital: '',
            contact_person: '',
            contact_person_number: '',
            sama_license_number: '',
            bank_type: '',
            license_status: '',
            establishment_date: '',
            authorized_capital: '',
            head_office_address: '',
            sama_compliance_status: '',
            number_of_branches: '',
            logo_url: '',
            credit_limit: '',
            first_name: '',
            last_name: '',
            position: '',
            phone: '',
            bank_user_id: ''
        })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const openCreateForm = (type) => {
        setCreateFormType(type)
        setShowCreateForm(true)
        resetForm()
    }

    if (loading && businessUsers.length === 0 && bankUsers.length === 0 && bankEmployees.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'businesses', name: 'Businesses', count: businessUsers.length },
                        { id: 'banks', name: 'Banks', count: bankUsers.length },
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

            {/* Create User Form */}
            {showCreateForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {formData.email ? 'Edit' : 'Create New'} {createFormType.charAt(0).toUpperCase() + createFormType.slice(1)} User
                    </h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        {/* Common fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Business-specific fields */}
                        {createFormType === 'business' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trade Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="trade_name"
                                        value={formData.trade_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CR Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="cr_number"
                                        value={formData.cr_number}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CR Capital
                                    </label>
                                    <input
                                        type="number"
                                        name="cr_capital"
                                        value={formData.cr_capital}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_person_number"
                                        value={formData.contact_person_number}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bank-specific fields */}
                        {createFormType === 'bank' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Entity Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="entity_name"
                                        value={formData.entity_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        SAMA License Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="sama_license_number"
                                        value={formData.sama_license_number}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Type
                                    </label>
                                    <select
                                        name="bank_type"
                                        value={formData.bank_type}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Bank Type</option>
                                        <option value="Commercial Bank">Commercial Bank</option>
                                        <option value="Islamic Bank">Islamic Bank</option>
                                        <option value="Investment Bank">Investment Bank</option>
                                        <option value="Development Bank">Development Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Credit Limit
                                    </label>
                                    <input
                                        type="number"
                                        name="credit_limit"
                                        value={formData.credit_limit}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_person_number"
                                        value={formData.contact_person_number}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Employee-specific fields */}
                        {createFormType === 'employee' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Entity *
                                    </label>
                                    <select
                                        name="bank_user_id"
                                        value={formData.bank_user_id}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Bank</option>
                                        {bankUsers.map(bank => (
                                            <option key={bank.user_id} value={bank.user_id}>
                                                {bank.entity_name || bank.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                            >
                                {formData.email ? 'Update' : 'Create'} {createFormType.charAt(0).toUpperCase() + createFormType.slice(1)}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'businesses' && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Business Users ({businessUsers.length})
                        </h3>
                        <button
                            onClick={() => openCreateForm('business')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Add Business
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Business
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CR Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {businessUsers.map((user) => (
                                    <tr key={user.user_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.entity_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.cr_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewUser(user, 'business')}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user, 'business')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.user_id, 'business')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {businessUsers.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <p className="text-gray-500">No business users found.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'banks' && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Bank Users ({bankUsers.length})
                        </h3>
                        <button
                            onClick={() => openCreateForm('bank')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Add Bank
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SAMA License
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bankUsers.map((bank) => (
                                    <tr key={bank.user_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {bank.entity_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{bank.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {bank.logo_url ? (
                                                <img 
                                                    src={bank.logo_url} 
                                                    alt={`${bank.entity_name} logo`}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'inline';
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {bank.entity_name?.charAt(0)?.toUpperCase() || 'B'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bank.sama_license_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bank.bank_type || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {bank.created_at ? new Date(bank.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewUser(bank, 'bank')}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(bank, 'bank')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(bank.user_id, 'bank')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {bankUsers.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <p className="text-gray-500">No bank users found.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'employees' && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Bank Employees ({bankEmployees.length})
                        </h3>
                        <button
                            onClick={() => openCreateForm('employee')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Add Employee
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank Entity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank Logo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bankEmployees.map((employee) => (
                                    <tr key={employee.employee_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {employee.first_name} {employee.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{employee.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {employee.bank_entity_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {employee.bank_logo_url ? (
                                                <img 
                                                    src={employee.bank_logo_url} 
                                                    alt={`${employee.bank_entity_name} logo`}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'inline';
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {employee.bank_entity_name?.charAt(0)?.toUpperCase() || 'B'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {employee.position || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {employee.last_login_at 
                                                ? new Date(employee.last_login_at).toLocaleDateString()
                                                : 'Never'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewUser(employee, 'employee')}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(employee, 'employee')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {bankEmployees.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <p className="text-gray-500">No bank employees found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
