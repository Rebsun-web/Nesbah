'use client'

import { AdminAuthProvider } from '@/contexts/AdminAuthContext'

export default function AdminLayout({ children }) {
    return (
        <AdminAuthProvider>
            {children}
        </AdminAuthProvider>
    )
}
