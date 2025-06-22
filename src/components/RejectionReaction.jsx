'use client'
import { useEffect, useState } from 'react'

export default function RejectionReaction({ user }) {
  const [rejections, setRejections] = useState([]);

  useEffect(() => {
    console.log('Received user object:', user); // 🐞 DEBUG
    const fetchRejections = async () => {
      try {
        const res = await fetch(`/api/leads/${user.user_id}/ignored_applications`);
        const data = await res.json();
        console.log('API response:', data); // 🐞 DEBUG
        if (data.success) {
          setRejections(data.rejections);
        }
      } catch (err) {
        console.error('Error fetching rejection data:', err);
      }
    };

    if (user?.user_id) {
      fetchRejections();
    }
  }, [user]);

  if (!Array.isArray(rejections)) return null;

  return (
      <div className="mx-auto max-w-7xl">
        <div className="space-y-4 pt-6">
          {rejections.map((rej, index) => (
              <div
                  key={index}
                  className="overflow-hidden rounded-lg shadow bg-red-800 border border-gray-200"
              >
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    Rejected by {rej.entity_name}
                  </h2>
                  <span className="text-sm text-white">
                {new Date(rej.timestamp).toLocaleString()}
              </span>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:p-6">
                  <p className="text-sm text-gray-700">
                    <strong>Reason:</strong> {rej.rejection_reason}
                  </p>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
