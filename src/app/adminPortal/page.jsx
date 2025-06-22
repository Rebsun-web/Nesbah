
import { PaperClipIcon } from '@heroicons/react/20/solid'
import { Container } from '@/components/container'
import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import { PosApplication } from '@/components/posApplication'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import {ApplicationLimit} from '@/components/ApplicationLimit'
import {Stat} from '@/components/stat'
import { Heading, Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getRecentOrders } from '@/data'
import { Avatar } from '@/components/avatar'
import StackedCard from '@/components/stackedCard'
import Graphs from '@/components/Graphs'

async function RetailMonitor() {

    let orders = await getRecentOrders()

    return (
        <div className="overflow-hidden pb-32">
            {/* 🟪 Container 1 (Dashboard, Business Info) */}
            <div className="min-h-full">
                <div className="pt-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Heading>Good afternoon, Erica</Heading>
                    </div>
                    <main>
                        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <Select name="period">
                                <option value="last_week">Last week</option>
                                <option value="last_two">Last two weeks</option>
                                <option value="last_month">Last month</option>
                                <option value="last_quarter">Last quarter</option>
                            </Select>
                            <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                                <Stat title="Total revenue" value="$2.6M" change="+4.5%" />
                                <Stat
                                    title="Average order value"
                                    value="$455"
                                    change="-0.5%"
                                />
                                <Stat title="Tickets sold" value="5,888" change="+4.5%" />
                                <Stat title="Pageviews" value="823,067" change="+21.2%" />
                            </div>
                            <div className="py-10">
                                <Graphs/>
                            </div>
                        </div>
                    </main>
                </div>
            </div>



            {/* 🟦 2nd Container (current applciation */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Incoming application
                    </h1>
                </div>
                <div className="py-5">
                    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
                        <TableHead>
                            <TableRow>
                                <TableHeader>Order number</TableHeader>
                                <TableHeader>Purchase date</TableHeader>
                                <TableHeader>Customer</TableHeader>
                                <TableHeader>Event</TableHeader>
                                <TableHeader className="text-right">Amount</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell className="text-zinc-500">{order.date}</TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar src={order.event.thumbUrl} className="size-6" />
                                            <span>{order.event.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">US{order.amount.usd}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* 🟨 Container 3 (Tabs + Form) */}
        </div>
    )
}

async function IndividualMonitor() {

    let orders = await getRecentOrders()

    return (
        <div className="overflow-hidden pb-32">
            {/* 🟪 Container 1 (Dashboard, Business Info) */}
            <div className="min-h-full">
                <div className="pt-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Heading>Good afternoon, Erica</Heading>
                    </div>
                    <main>
                        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <Select name="period">
                                <option value="last_week">Last week</option>
                                <option value="last_two">Last two weeks</option>
                                <option value="last_month">Last month</option>
                                <option value="last_quarter">Last quarter</option>
                            </Select>
                            <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                                <Stat title="Total revenue" value="$2.6M" change="+4.5%" />
                                <Stat
                                    title="Average order value"
                                    value="$455"
                                    change="-0.5%"
                                />
                                <Stat title="Tickets sold" value="5,888" change="+4.5%" />
                                <Stat title="Pageviews" value="823,067" change="+21.2%" />
                            </div>
                            <div className="py-10">
                                <Graphs/>
                            </div>
                        </div>
                    </main>
                </div>
            </div>



            {/* 🟦 2nd Container (current applciation */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Incoming application
                    </h1>
                </div>
                <div className="py-5">
                    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
                        <TableHead>
                            <TableRow>
                                <TableHeader>Order number</TableHeader>
                                <TableHeader>Purchase date</TableHeader>
                                <TableHeader>Customer</TableHeader>
                                <TableHeader>Event</TableHeader>
                                <TableHeader className="text-right">Amount</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell className="text-zinc-500">{order.date}</TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar src={order.event.thumbUrl} className="size-6" />
                                            <span>{order.event.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">US{order.amount.usd}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* 🟨 Container 3 (Tabs + Form) */}
        </div>
    )
}


export default async function BusinessDashboardPage() {
    return (
        <div>
            <main className="pb-32">
                <BankNavbar/>
                <RetailMonitor/>
                <IndividualMonitor/>
            </main>
            <NewFooter/>
        </div>
    )
}
