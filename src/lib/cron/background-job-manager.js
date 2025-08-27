// Basic background job manager for admin API routes
export class BackgroundJobManager {
    constructor() {
        this.jobs = new Map();
        this.stats = {
            totalJobs: 0,
            runningJobs: 0,
            completedJobs: 0,
            failedJobs: 0
        };
    }

    async addJob(jobId, jobFunction) {
        this.jobs.set(jobId, {
            id: jobId,
            status: 'pending',
            startTime: null,
            endTime: null,
            result: null,
            error: null,
            function: jobFunction
        });
        this.stats.totalJobs++;
        return jobId;
    }

    async startJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        job.status = 'running';
        job.startTime = new Date();
        this.stats.runningJobs++;

        try {
            job.result = await job.function();
            job.status = 'completed';
            job.endTime = new Date();
            this.stats.completedJobs++;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.endTime = new Date();
            this.stats.failedJobs++;
        } finally {
            this.stats.runningJobs--;
        }

        return job;
    }

    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }

    getAllJobs() {
        return Array.from(this.jobs.values());
    }

    getStats() {
        return { ...this.stats };
    }

    clearCompletedJobs() {
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                this.jobs.delete(jobId);
            }
        }
    }
}

// Export a singleton instance
export const backgroundJobManager = new BackgroundJobManager();

// Also export as default for compatibility
export default backgroundJobManager;
