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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload an image.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File size too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'bank-logos');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const filename = `bank-logo-${timestamp}-${randomString}.${fileExtension}`;
        const filepath = join(uploadsDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the public URL
        const logoUrl = `/uploads/bank-logos/${filename}`;

        return NextResponse.json({
            success: true,
            message: 'Logo uploaded successfully',
            logo_url: logoUrl
        });

    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload logo' },
            { status: 500 }
        );
    }
}
