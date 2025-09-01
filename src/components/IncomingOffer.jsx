'use client'
import { useEffect, useState } from 'react'

// Constants
const APPLICATION_TIMEOUT_SECONDS = 48 * 60 * 60; // 48 hours in seconds

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function IncomingOffer({ user }) {
    const [applications, setApplications] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await fetch(`/api/posApplication/${user.user_id}`);
                const data = await res.json();
                if (data.success) {
                    setApplications(data.data);
                }
            } catch (err) {
                console.error('Error fetching applications:', err);
            }
        };

        if (user?.user_id) {
            fetchApplications();
        }
    }, [user]);

    // Update current time every second for real-time countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!applications.length) return null;

    return (
        <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl pt-6 pb-4 font-semibold tracking-tight text-gray-900">
                Your current application
            </h1>
            <div className="space-y-4">
                {applications.map((app, index) => (
                    <div
                        key={app.application_id}
                        className="overflow-hidden rounded-lg shadow"
                        style={{
                            background: 'linear-gradient(-90deg, #742CFF -9.53%, #1E1851 180.33%)',
                        }}
                    >
                        <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold text-white">
                                Application #{index + 1}
                            </h2>
                            {(() => {
                              const submittedAt = new Date(app.submitted_at);
                              const elapsedSeconds = Math.floor((currentTime - submittedAt) / 1000);
                              const remainingSeconds = APPLICATION_TIMEOUT_SECONDS - elapsedSeconds;
                              
                              // Debug information (can be removed in production)
                              console.log(`App #${app.application_id}: Submitted ${elapsedSeconds}s ago, ${remainingSeconds}s remaining`);
                              
                              // Only show countdown if there's still time remaining
                              if (remainingSeconds > 0) {
                                return (
                                  <span
                                      className="inline-flex items-center rounded-full bg-red-300 px-3 py-1 text-sm font-medium text-red-800">
                    ⏳ {formatDuration(remainingSeconds)}
                  </span>
                                );
                              } else {
                                // Countdown has expired (48 hours have passed)
                                console.log(`App #${app.application_id}: Countdown expired, hiding timer`);
                                return null;
                              }
                            })()}
                        </div>

                        <div className="bg-gray-50 px-4 py-5 sm:p-6 space-y-2">
                            <p className="text-sm text-gray-600"><strong>Bank:</strong> {app.notes}</p>
                            <p className="text-sm text-gray-600"><strong>Submitted
                                At:</strong> {new Date(app.submitted_at).toLocaleString()}</p>
                            <p className="text-sm text-gray-600"><strong>Own POS
                                System:</strong> {app.own_pos_system ? 'Yes' : 'No'}</p>

                            {app.uploaded_document && (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Uploaded Document:</p>
                                    <a
                                        href={`/api/download/${app.application_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:underline text-sm"
                                    >
                                        Download file
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
