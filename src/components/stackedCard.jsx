'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

function CountdownBadge({ seconds }) {
    const [timeLeft, setTimeLeft] = useState(seconds)

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60)
        const sec = secs % 60
        return `${mins}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <span className="inline-flex items-center rounded-full bg-red-300 px-3 py-1 text-sm font-medium text-red-800">
            ⏳ {formatTime(timeLeft)}
        </span>
    )
}

export default function StackedCard({ userId }) {
    const [items, setItems] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (!userId) return;

        const fetchLeads = async () => {
            try {
                const res = await axios.get('/api/leads', {
                    headers: {
                        'x-user-id': userId,
                        'x-user-type': 'bank_user', // Default to bank_user for this component
                    },
                });

                const now = new Date();
                const filtered = res.data.data.filter((item) => {
                    const submittedAt = new Date(item.submitted_at);
                    const secondsSinceSubmission = (now - submittedAt) / 1000;
                    const secondsLeft = 48 * 3600 - secondsSinceSubmission;

                    return secondsLeft <= 12 * 3600 && secondsLeft > 0;
                });

                setItems(filtered);
            } catch (error) {
                console.error('Error fetching stacked leads:', error);
            }
        };

        fetchLeads();
    }, [userId]);

    const handleClick = (id) => {
        router.push(`/leads/${id}`);
    };

    return (
        <div className="pt-5">
            <ul role="list" className="space-y-3">
                {items.map((item) => {
                    const submittedAt = new Date(item.submitted_at);
                    const now = new Date();
                    const secondsLeft = 48 * 3600 - (now - submittedAt) / 1000;

                    return (
                        <li
                            key={item.application_id}
                            onClick={() => handleClick(item.application_id)}
                            className="flex items-center justify-between overflow-hidden bg-red-50 px-4 py-4 shadow sm:rounded-md sm:px-6 cursor-pointer"
                        >
                            <span className="text-sm font-medium text-gray-900">
                                POS Application #{item.application_id}
                            </span>
                            <CountdownBadge seconds={Math.floor(secondsLeft)} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}