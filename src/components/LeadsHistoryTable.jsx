'use client'

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useRouter } from 'next/navigation'

export default function LeadsHistoryTable({ data }) {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleRowClick = (applicationId) => {
        router.push(`/leads/${applicationId}/history`);
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                No application history found.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <thead>
                <tr>
                    <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700">
                        Application ID
                    </th>
                    <th className="bg-gray-100 px-4 py-4 text-start text-sm font-semibold text-gray-700">Purchased At
                    </th>
                    <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700">Application
                        Type
                    </th>
                    <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700">Status</th>
                </tr>
                </thead>
                <TableBody>
                    {data.map((lead) => (
                        <TableRow
                            key={lead.application_id}
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleRowClick(lead.application_id)}
                        >
                            <TableCell className="text-start">{lead.application_id}</TableCell>
                            <TableCell className="text-start">
                                {lead.purchased_by_timestamps && user && lead.purchased_by_timestamps[user.user_id]
                                    ? new Date(lead.purchased_by_timestamps[user.user_id]).toLocaleString()
                                    : 'N/A'}
                            </TableCell>
                            <TableCell className="text-start" >POS Application</TableCell>
                            <TableCell className="text-start">
                                {lead.purchased_by && lead.purchased_by.length > 0
                                    ? 'Approved'
                                    : 'Opened'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
