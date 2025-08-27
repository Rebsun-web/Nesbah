'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useRouter } from 'next/navigation'

export default function BankLeadsTable({ data }) {
    const router = useRouter();

    const handleRowClick = async (applicationId) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const bankUser = JSON.parse(storedUser);

        try {
            const res = await fetch(`/api/leads/${applicationId}`, {
                method: 'GET',
                headers: {
                    'x-user-id': bankUser.user_id,
                },
            });

            const result = await res.json();

            if (res.ok && result.success) {
                router.push(`/leads/${applicationId}`);
            } else {
                console.error('Failed to mark as opened:', result.error);
            }
        } catch (err) {
            console.error('Error contacting API:', err);
        }
    };

    const formatCountdown = (submittedAt, auctionEndTime) => {
        // If auction_end_time is available, use it; otherwise calculate 48 hours from submission
        const endTime = auctionEndTime ? new Date(auctionEndTime) : new Date(new Date(submittedAt).getTime() + 48 * 60 * 60 * 1000);
        const now = new Date();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            return '⛔ Expired';
        } else {
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return `${hoursLeft}h ${minutesLeft}m left`;
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const now = new Date();

        // Use the same logic as formatCountdown for consistency
        const aEndTime = a.auction_end_time ? new Date(a.auction_end_time) : new Date(new Date(a.submitted_at).getTime() + 48 * 60 * 60 * 1000);
        const bEndTime = b.auction_end_time ? new Date(b.auction_end_time) : new Date(new Date(b.submitted_at).getTime() + 48 * 60 * 60 * 1000);

        const aTimeLeft = aEndTime - now;
        const bTimeLeft = bEndTime - now;

        // Sort by urgency (least time left first)
        return aTimeLeft - bTimeLeft;
    });

    return (
      <div className="mt-6 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <Table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700 rounded-tl-md">
                    Application ID
                  </th>
                  <th className="bg-gray-100 px-4 py-4 text-start text-sm font-semibold text-gray-700">Submitted At</th>
                  <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700">Application Type</th>
                  <th className="bg-gray-100 px-4 py-3 text-start text-sm font-semibold text-gray-700 rounded-tr-md">Countdown</th>
                </tr>
              </thead>
              <TableBody>
                {sortedData.map((lead) => {
                  // Use the same logic as formatCountdown for consistency
                  const endTime = lead.auction_end_time ? new Date(lead.auction_end_time) : new Date(new Date(lead.submitted_at).getTime() + 48 * 60 * 60 * 1000);
                  const now = new Date();
                  const timeLeft = endTime - now;
                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

                  return (
                    <TableRow
                      key={lead.application_id}
                      onClick={() => handleRowClick(lead.application_id)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        hoursLeft < 2 ? 'bg-red-50' : hoursLeft < 6 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <TableCell className="whitespace-nowrap text-sm text-center  text-gray-500">
                        {lead.application_id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-start text-gray-500">
                        {new Date(lead.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-start text-gray-500">
                        POS Application
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-start font-semibold text-red-600">
                        ⏳ {formatCountdown(lead.submitted_at, lead.auction_end_time)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
}
