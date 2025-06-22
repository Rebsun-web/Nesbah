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

    const formatCountdown = (submittedAt) => {
        const submitted = new Date(submittedAt);
        const now = new Date();
        const hoursPassed = Math.floor((now - submitted) / (1000 * 60 * 60));
        const hoursLeft = 48 - hoursPassed;

        if (hoursLeft <= 0) {
            return '⛔ Expired';
        } else {
            return `${hoursLeft} hours left`;
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const now = new Date();

        const aSubmitted = new Date(a.submitted_at);
        const bSubmitted = new Date(b.submitted_at);

        const aHoursPassed = (now - aSubmitted) / (1000 * 60 * 60);
        const bHoursPassed = (now - bSubmitted) / (1000 * 60 * 60);

        // Sort descending by how close to 48 hours they are (i.e., highest hours passed first)
        return bHoursPassed - aHoursPassed;
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
                  const submitted = new Date(lead.submitted_at)
                  const now = new Date()
                  const hoursPassed = (now - submitted) / (1000 * 60 * 60)
                  const hoursLeft = 48 - hoursPassed

                  return (
                    <TableRow
                      key={lead.application_id}
                      onClick={() => handleRowClick(lead.application_id)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        hoursLeft < 10 ? 'bg-red-50' : ''
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
                        ⏳ {formatCountdown(lead.submitted_at)}
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
