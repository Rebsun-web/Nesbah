/**
 * Google Cloud Storage Service
 * Handles file uploads to GCS for production, falls back to local filesystem for development
 */

import fs from 'fs';
import path from 'path';

class GCSStorageService {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.bucketName = process.env.GCS_BUCKET_NAME || 'nesbah-uploads';
        this.storage = null;
        this.bucket = null;
        this.StorageClass = null;
        this.gcsAvailable = false;
        this.initializationPromise = null;
    }

    async initializeGCS() {
        // Return existing promise if already initializing
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            // Only try to load GCS in production
            if (this.isProduction) {
                try {
                    // Dynamic import to avoid errors if package not installed
                    const gcsModule = await import('@google-cloud/storage');
                    this.StorageClass = gcsModule.Storage;
                    
                    this.storage = new this.StorageClass({
                        projectId: process.env.GCLOUD_PROJECT_ID || 'nesbahdev',
                    });
                    this.bucket = this.storage.bucket(this.bucketName);
                    this.gcsAvailable = true;
                    console.log('✅ GCS Storage initialized for production');
                } catch (error) {
                    console.warn('⚠️ GCS not available, using local filesystem:', error.message);
                    console.warn('   Install with: npm install @google-cloud/storage');
                    this.gcsAvailable = false;
                }
            } else {
                console.log('📁 Using local filesystem storage for development');
            }
        })();

        return this.initializationPromise;
    }

    /**
     * Upload a file to storage (GCS in production, local filesystem in development)
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} fileName - File name
     * @param {string} folder - Folder path (e.g., 'bank-logos', 'documents/userId')
     * @param {string} contentType - MIME type
     * @returns {Promise<string>} Public URL of the uploaded file
     */
    async uploadFile(fileBuffer, fileName, folder = '', contentType = 'application/octet-stream') {
        // Wait for GCS initialization if needed
        if (this.isProduction && !this.gcsAvailable && !this.StorageClass) {
            await this.initializeGCS();
        }

        if (this.isProduction && this.gcsAvailable && this.bucket) {
            return this.uploadToGCS(fileBuffer, fileName, folder, contentType);
        } else {
            return this.uploadToLocal(fileBuffer, fileName, folder);
        }
    }

    /**
     * Upload to Google Cloud Storage
     */
    async uploadToGCS(fileBuffer, fileName, folder, contentType) {
        try {
            const filePath = folder ? `${folder}/${fileName}` : fileName;
            const file = this.bucket.file(filePath);

            await file.save(fileBuffer, {
                metadata: {
                    contentType: contentType,
                    cacheControl: 'public, max-age=31536000', // Cache for 1 year
                },
            });

            // The bucket has Uniform Bucket-Level Access enabled, which grants public
            // read via a bucket-level IAM binding (allUsers -> objectViewer) and
            // disables the legacy per-object ACL API. Calling file.makePublic() here
            // throws ("Cannot update access control ... uniform bucket-level access is
            // enabled") and was silently sending every upload through the local-disk
            // fallback below — no need to call it since the bucket already makes
            // every object public.

            // Return public URL
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
            console.log(`✅ File uploaded to GCS: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error('❌ GCS upload error:', error);
            // Fall back to local if GCS fails
            console.log('⚠️ Falling back to local storage');
            return this.uploadToLocal(fileBuffer, fileName, folder);
        }
    }

    /**
     * Upload to local filesystem (development)
     */
    async uploadToLocal(fileBuffer, fileName, folder) {
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, fileBuffer);

            // Return relative URL (Next.js serves files from public folder)
            const publicUrl = `/uploads/${folder ? folder + '/' : ''}${fileName}`;
            console.log(`✅ File uploaded locally: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error('❌ Local upload error:', error);
            throw new Error(`Failed to upload file locally: ${error.message}`);
        }
    }

    /**
     * Delete a file from storage
     * @param {string} filePath - File path (relative to bucket/folder)
     * @param {string} folder - Folder path
     */
    async deleteFile(filePath, folder = '') {
        if (this.isProduction && this.gcsAvailable && this.bucket) {
            try {
                const fullPath = folder ? `${folder}/${filePath}` : filePath;
                await this.bucket.file(fullPath).delete();
                console.log(`✅ File deleted from GCS: ${fullPath}`);
            } catch (error) {
                console.error('❌ GCS delete error:', error);
                // Don't throw - file might not exist
            }
        } else {
            try {
                const localPath = path.join(process.cwd(), 'public', 'uploads', folder, filePath);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                    console.log(`✅ File deleted locally: ${localPath}`);
                }
            } catch (error) {
                console.error('❌ Local delete error:', error);
            }
        }
    }

    /**
     * Get file URL (handles both GCS and local)
     * @param {string} filePath - File path stored in database
     * @returns {string} Public URL
     */
    getFileUrl(filePath) {
        if (!filePath) return null;
        
        // If it's already a full URL (GCS), return as-is
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        
        // If it's a relative path (local), return as-is (Next.js will serve it)
        return filePath;
    }
}

// Export singleton instance
const gcsStorage = new GCSStorageService();
export default gcsStorage;
