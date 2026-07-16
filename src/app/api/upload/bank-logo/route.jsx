import { NextResponse } from 'next/server';
import path from 'path';
import gcsStorage from '@/lib/storage/gcs-storage';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function POST(req) {
    try {
        // Authenticate — bank users/employees (self-serve) and admins may upload.
        const authResult = await authenticateAPIRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error || 'Unauthorized' },
                { status: authResult.status || 401 }
            );
        }
        const { user_type } = authResult.user;
        if (!['bank_user', 'bank_employee', 'admin_user'].includes(user_type)) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('logo');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No logo file provided' },
                { status: 400 }
            );
        }

        // Validate file type - only allow common image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: `File size too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB.` },
                { status: 400 }
            );
        }

        // Validate file size (minimum 1KB)
        if (file.size < 1024) {
            return NextResponse.json(
                { success: false, error: 'File size too small. Minimum size is 1KB.' },
                { status: 400 }
            );
        }

        // Validate extension as a second line of defence
        const fileExtension = (file.name.split('.').pop() || '').toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file extension. Please upload a valid image file.' },
                { status: 400 }
            );
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `bank-logo-${timestamp}-${randomString}${path.extname(file.name)}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Store durably via the storage service (GCS in production, local in dev).
        // Ephemeral local-disk writes were the cause of logos not displaying on Cloud Run.
        const logoUrl = await gcsStorage.uploadFile(buffer, fileName, 'bank-logos', file.type);

        return NextResponse.json({
            success: true,
            message: 'Logo uploaded successfully',
            logo_url: logoUrl,
            filename: fileName,
            size: buffer.length,
            type: file.type
        });

    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload logo. Please try again.' },
            { status: 500 }
        );
    }
}
