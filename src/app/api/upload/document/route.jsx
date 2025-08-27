import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('document');
        const userId = formData.get('user_id');
        const documentType = formData.get('document_type') || 'application';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No document file provided' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Validate file type - allow common document formats
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload a PDF, Word, Excel, or image file.' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB for documents)
        const maxSize = 10 * 1024 * 1024; // 10MB
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
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents', userId.toString());
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename with better security
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const filename = `${documentType}-${timestamp}-${randomString}.${fileExtension}`;
        const filepath = join(uploadsDir, filename);

        // Additional security check for file extension
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file extension. Please upload a valid document file.' },
                { status: 400 }
            );
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Write file to disk
        await writeFile(filepath, buffer);

        // Return the file information
        const fileInfo = {
            filename: filename,
            originalName: file.name,
            size: buffer.length,
            type: file.type,
            extension: fileExtension,
            path: `/uploads/documents/${userId}/${filename}`,
            uploadedAt: new Date().toISOString()
        };

        console.log(`✅ Document uploaded successfully: ${filename} (${(buffer.length / 1024).toFixed(2)}KB) for user ${userId}`);

        return NextResponse.json({
            success: true,
            message: 'Document uploaded successfully',
            file: fileInfo
        });

    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload document. Please try again.' },
            { status: 500 }
        );
    }
}
