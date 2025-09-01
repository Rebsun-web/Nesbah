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

    if (!data) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Loading purchased leads...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No purchased leads found.</p>
                <p className="text-sm text-gray-400 mt-2">Submit offers on available leads to see them here.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            <Table>
                <thead>
                <tr>
                    <th className="bg-gray-100 px-3 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                        App ID
                    </th>
                    <th className="bg-gray-100 px-3 py-3 text-center text-sm font-semibold text-gray-700 w-32">
                        Business Name
                    </th>
                    <th className="bg-gray-100 px-3 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                        Offer Date
                    </th>
                    <th className="bg-gray-100 px-3 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                        Status
                    </th>
                </tr>
                </thead>
                <TableBody>
                    {data.map((lead) => (
                        <TableRow
                            key={lead.application_id}
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleRowClick(lead.application_id)}
                        >
                            <TableCell className="text-start text-xs">{lead.application_id}</TableCell>
                            <TableCell className="text-start text-xs truncate" title={lead.trade_name || 'N/A'}>
                                {lead.trade_name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-start text-xs">
                                {lead.offer_submitted_at 
                                    ? new Date(lead.offer_submitted_at).toLocaleDateString()
                                    : 'N/A'}
                            </TableCell>
                            <TableCell className="text-start text-xs">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Live Auction
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
