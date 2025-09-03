import { validateApplicationStatus } from '../status-validation';

/**
 * Middleware to automatically validate application statuses in API responses
 * This ensures all APIs return consistent, validated statuses
 */
export async function withStatusValidation(apiHandler) {
    return async (req, context) => {
        // Call the original API handler
        const response = await apiHandler(req, context);
        
        // If response is successful and contains application data, validate statuses
        if (response && response.status === 200) {
            try {
                const responseData = await response.json();
                
                // Check if response contains application data that needs validation
                if (responseData.data && responseData.data.application_id) {
                    // Single application
                    const validationResult = await validateApplicationStatus(
                        responseData.data.application_id,
                        responseData.data.status
                    );
                    
                    if (validationResult.wasCorrected) {
                        // Update the response data with validated status
                        responseData.data.status = validationResult.status;
                        responseData.data.status_was_corrected = true;
                        responseData.data.status_correction_reason = validationResult.reason;
                        
                        // Create new response with updated data
                        return new Response(JSON.stringify(responseData), {
                            status: 200,
                            headers: response.headers
                        });
                    }
                } else if (responseData.data && Array.isArray(responseData.data)) {
                    // Multiple applications
                    let hasCorrections = false;
                    const correctedData = await Promise.all(
                        responseData.data.map(async (item) => {
                            if (item.application_id && item.status) {
                                const validationResult = await validateApplicationStatus(
                                    item.application_id,
                                    item.status
                                );
                                
                                if (validationResult.wasCorrected) {
                                    hasCorrections = true;
                                    return {
                                        ...item,
                                        status: validationResult.status,
                                        status_was_corrected: true,
                                        status_correction_reason: validationResult.reason
                                    };
                                }
                            }
                            return item;
                        })
                    );
                    
                    if (hasCorrections) {
                        responseData.data = correctedData;
                        return new Response(JSON.stringify(responseData), {
                            status: 200,
                            headers: response.headers
                        });
                    }
                }
                
                // Return original response if no corrections needed
                return response;
                
            } catch (error) {
                console.error('Status validation middleware error:', error);
                // Return original response if validation fails
                return response;
            }
        }
        
        return response;
    };
}

/**
 * Higher-order function to wrap API handlers with status validation
 * Usage: export const GET = withStatusValidation(async (req, context) => { ... })
 */
export function withStatusValidationWrapper(apiHandler) {
    return withStatusValidation(apiHandler);
}
