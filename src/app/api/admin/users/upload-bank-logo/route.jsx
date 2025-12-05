import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import path from 'path';
import fs from 'fs';
import gcsStorage from '@/lib/storage/gcs-storage';

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Parse the multipart form data
        const formData = await req.formData();
        const logoFile = formData.get('logo');
        
        if (!logoFile) {
            return NextResponse.json({ 
                success: false, 
                error: 'No logo file provided' 
            }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(logoFile.type)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' 
            }, { status: 400 });
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (logoFile.size > maxSize) {
            return NextResponse.json({ 
                success: false, 
                error: 'File size must be less than 5MB' 
            }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(logoFile.name);
        const fileName = `bank-logo-${timestamp}-${randomString}${fileExtension}`;
        
        // Convert file to buffer
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload using storage service (GCS in production, local in development)
        const logoUrl = await gcsStorage.uploadFile(
            buffer,
            fileName,
            'bank-logos',
            logoFile.type
        );
        
        return NextResponse.json({
            success: true,
            logo_url: logoUrl,
            message: 'Logo uploaded successfully',
            fileName: fileName,
            size: buffer.length
        });

    } catch (error) {
        console.error('Error uploading bank logo:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload logo' },
            { status: 500 }
        );
    }
}
