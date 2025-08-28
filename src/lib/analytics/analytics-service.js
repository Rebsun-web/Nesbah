// Minimal analytics service
export class AnalyticsService {
    static async trackEvent(event, data) {
        // Placeholder implementation
        console.log('Analytics event:', event, data);
        return { success: true };
    }
}
