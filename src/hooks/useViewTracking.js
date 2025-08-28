import { useEffect, useRef } from 'react';

export const useViewTracking = (applicationId, bankUserId, enabled = true) => {
    const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const viewStartTime = useRef(null);
    const hasTrackedView = useRef(false);

    // Track when component mounts (application view)
    useEffect(() => {
        if (!enabled || !applicationId || !bankUserId || hasTrackedView.current) {
            return;
        }

        const trackView = async () => {
            try {
                viewStartTime.current = Date.now();
                hasTrackedView.current = true;

                await fetch('/api/bank/application-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        application_id: applicationId,
                        action_type: 'view',
                        session_id: sessionId.current
                    }),
                    credentials: 'include'
                });

                // Also track offer preparation start
                await fetch('/api/bank/application-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        application_id: applicationId,
                        action_type: 'offer_preparation_start',
                        session_id: sessionId.current
                    }),
                    credentials: 'include'
                });

            } catch (error) {
                console.error('Failed to track application view:', error);
            }
        };

        trackView();
    }, [applicationId, bankUserId, enabled]);

    // Track when component unmounts (offer preparation end)
    useEffect(() => {
        if (!enabled || !applicationId || !bankUserId) {
            return;
        }

        const trackOfferEnd = async () => {
            try {
                await fetch('/api/bank/application-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        application_id: applicationId,
                        action_type: 'offer_preparation_end',
                        session_id: sessionId.current
                    }),
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Failed to track offer preparation end:', error);
            }
        };

        // Track when user leaves the page
        const handleBeforeUnload = () => {
            trackOfferEnd();
        };

        // Track when component unmounts
        return () => {
            trackOfferEnd();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [applicationId, bankUserId, enabled]);

    // Track page visibility changes
    useEffect(() => {
        if (!enabled || !applicationId || !bankUserId) {
            return;
        }

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // User switched away from the page
                try {
                    await fetch('/api/bank/application-view', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            application_id: applicationId,
                            action_type: 'page_hidden',
                            session_id: sessionId.current
                        }),
                        credentials: 'include'
                    });
                } catch (error) {
                    console.error('Failed to track page hidden:', error);
                }
            } else {
                // User returned to the page
                try {
                    await fetch('/api/bank/application-view', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            application_id: applicationId,
                            action_type: 'page_visible',
                            session_id: sessionId.current
                        }),
                        credentials: 'include'
                    });
                } catch (error) {
                    console.error('Failed to track page visible:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [applicationId, bankUserId, enabled]);

    // Manual tracking functions
    const trackCustomAction = async (actionType, additionalData = {}) => {
        if (!enabled || !applicationId || !bankUserId) {
            return;
        }

        try {
            await fetch('/api/bank/application-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    application_id: applicationId,
                    action_type: actionType,
                    session_id: sessionId.current,
                    additional_data: additionalData
                }),
                credentials: 'include'
            });
        } catch (error) {
            console.error(`Failed to track ${actionType}:`, error);
        }
    };

    return {
        sessionId: sessionId.current,
        trackCustomAction,
        viewStartTime: viewStartTime.current
    };
};
