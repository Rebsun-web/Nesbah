import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req) {
    try {
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

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'bank-logos');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename with better security
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const filename = `bank-logo-${timestamp}-${randomString}.${fileExtension}`;
        const filepath = join(uploadsDir, filename);

        // Additional security check for file extension
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file extension. Please upload a valid image file.' },
                { status: 400 }
            );
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Write file to disk
        await writeFile(filepath, buffer);

        // Return the public URL
        const logoUrl = `/uploads/bank-logos/${filename}`;

        console.log(`✅ Bank logo uploaded successfully: ${filename} (${(buffer.length / 1024).toFixed(2)}KB)`);

        return NextResponse.json({
            success: true,
            message: 'Logo uploaded successfully',
            logo_url: logoUrl,
            filename: filename,
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
