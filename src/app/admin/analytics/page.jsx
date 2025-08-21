'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { AnimatedNumber } from '@/components/animated-number';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    FileText, 
    DollarSign, 
    Clock,
    MapPin,
    Building,
    Target,
    Activity
} from 'lucide-react';

export default function AnalyticsPage() {
    const [applicationsData, setApplicationsData] = useState(null);
    const [offersData, setOffersData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const [applicationsRes, offersRes] = await Promise.all([
                fetch('/api/admin/applications/analytics'),
                fetch('/api/admin/offers/analytics')
            ]);

            if (applicationsRes.ok && offersRes.ok) {
                const [applicationsJson, offersJson] = await Promise.all([
                    applicationsRes.json(),
                    offersRes.json()
                ]);

                if (applicationsJson.success && offersJson.success) {
                    setApplicationsData(applicationsJson.data);
                    setOffersData(offersJson.data);
                } else {
                    setError('Failed to fetch analytics data');
                }
            } else {
                setError('Failed to fetch analytics data');
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchAnalyticsData}>Retry</Button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            deal_won: 'bg-green-100 text-green-800',
            deal_lost: 'bg-red-100 text-red-800',
            pending: 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive overview of applications and offers performance</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="offers">Offers</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                                    <AnimatedNumber 
                                        value={applicationsData?.summary?.total_applications || 0}
                                        className="text-2xl font-bold text-gray-900"
                                    />
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                +{applicationsData?.summary?.recent_applications || 0} this month
                            </p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Offers</p>
                                    <AnimatedNumber 
                                        value={offersData?.summary?.total_offers || 0}
                                        className="text-2xl font-bold text-gray-900"
                                    />
                                </div>
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                +{offersData?.summary?.recent_offers || 0} this month
                            </p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                                    <AnimatedNumber 
                                        value={applicationsData?.summary?.overall_approval_rate || 0}
                                        className="text-2xl font-bold text-gray-900"
                                    />
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                                <Target className="h-8 w-8 text-purple-600" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Application success rate
                            </p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Win Rate</p>
                                    <AnimatedNumber 
                                        value={offersData?.summary?.overall_win_rate || 0}
                                        className="text-2xl font-bold text-gray-900"
                                    />
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                                <TrendingUp className="h-8 w-8 text-orange-600" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Offer success rate
                            </p>
                        </Card>
                    </div>

                    {/* Status Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Application Status Distribution</h3>
                            <div className="space-y-3">
                                {applicationsData?.by_status?.map((status) => (
                                    <div key={status.status} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getStatusColor(status.status)}>
                                                {status.status}
                                            </Badge>
                                        </div>
                                        <span className="font-medium">{status.count}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Offer Status Distribution</h3>
                            <div className="space-y-3">
                                {offersData?.by_status?.map((status) => (
                                    <div key={status.status} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getStatusColor(status.status)}>
                                                {status.status}
                                            </Badge>
                                        </div>
                                        <span className="font-medium">{status.count}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3">Recent Applications</h4>
                                <div className="space-y-2">
                                    {applicationsData?.recent_activity?.slice(0, 5).map((app) => (
                                        <div key={app.application_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-medium text-sm">{app.business_name}</p>
                                                <p className="text-xs text-gray-500">{app.city} • {app.sector}</p>
                                            </div>
                                            <Badge className={getStatusColor(app.status)}>
                                                {app.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3">Recent Offers</h4>
                                <div className="space-y-2">
                                    {offersData?.recent_activity?.slice(0, 5).map((offer) => (
                                        <div key={offer.offer_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-medium text-sm">{offer.business_name}</p>
                                                <p className="text-xs text-gray-500">{offer.bank_name}</p>
                                            </div>
                                            <Badge className={getStatusColor(offer.status)}>
                                                {offer.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="applications" className="space-y-6">
                    {/* Applications Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">By City</h3>
                            <div className="space-y-3">
                                {applicationsData?.by_city?.slice(0, 5).map((city) => (
                                    <div key={city.city} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{city.city}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{city.total_applications}</p>
                                            <p className="text-xs text-gray-500">{city.approval_rate}% approval</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">By Sector</h3>
                            <div className="space-y-3">
                                {applicationsData?.by_sector?.slice(0, 5).map((sector) => (
                                    <div key={sector.sector} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{sector.sector}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{sector.total_applications}</p>
                                            <p className="text-xs text-gray-500">{sector.approved_applications} approved</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Processing Time</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Average</span>
                                    <span className="font-medium">{applicationsData?.processing_time?.avg_processing_days || 0} days</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Fastest</span>
                                    <span className="font-medium">{applicationsData?.processing_time?.min_processing_days || 0} days</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Slowest</span>
                                    <span className="font-medium">{applicationsData?.processing_time?.max_processing_days || 0} days</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Top Revenue Applications */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Top Revenue Applications</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Business</th>
                                        <th className="text-left py-2">City</th>
                                        <th className="text-left py-2">Revenue</th>
                                        <th className="text-left py-2">Offers</th>
                                        <th className="text-left py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicationsData?.top_revenue?.map((app) => (
                                        <tr key={app.application_id} className="border-b">
                                            <td className="py-2">{app.business_name}</td>
                                            <td className="py-2">{app.city}</td>
                                            <td className="py-2 font-medium">{formatCurrency(app.revenue_collected)}</td>
                                            <td className="py-2">{app.offers_count}</td>
                                            <td className="py-2">
                                                <Badge className={getStatusColor(app.status)}>
                                                    {app.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="offers" className="space-y-6">
                    {/* Offers Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Performing Banks</h3>
                            <div className="space-y-3">
                                {offersData?.by_bank?.slice(0, 5).map((bank) => (
                                    <div key={bank.bank_user_id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{bank.bank_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{bank.total_offers}</p>
                                            <p className="text-xs text-gray-500">{bank.win_rate}% win rate</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Average Metrics</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Setup Fee</span>
                                    <span className="font-medium">{formatCurrency(offersData?.average_metrics?.avg_setup_fee)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Mada Fee</span>
                                    <span className="font-medium">{formatCurrency(offersData?.average_metrics?.avg_mada_fee)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Visa/MC Fee</span>
                                    <span className="font-medium">{formatCurrency(offersData?.average_metrics?.avg_visa_mc_fee)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Settlement Time</span>
                                    <span className="font-medium">{offersData?.average_metrics?.avg_settlement_time || 0} days</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Featured Offers */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Featured Offers</h3>
                        <div className="space-y-3">
                            {offersData?.featured_offers?.map((offer) => (
                                <div key={offer.offer_id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                    <div>
                                        <p className="font-medium">{offer.business_name}</p>
                                        <p className="text-sm text-gray-500">{offer.bank_name} • {offer.featured_reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={getStatusColor(offer.status)}>
                                            {offer.status}
                                        </Badge>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(offer.submitted_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    {/* Trends Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Application Trends (12 Months)</h3>
                            <div className="space-y-3">
                                {applicationsData?.trends?.map((trend) => (
                                    <div key={trend.month} className="flex items-center justify-between">
                                        <span className="text-sm">
                                            {new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xs text-green-600">{trend.approved_applications} approved</span>
                                            <span className="text-xs text-red-600">{trend.rejected_applications} rejected</span>
                                            <span className="text-xs text-yellow-600">{trend.pending_applications} pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Offer Trends (12 Months)</h3>
                            <div className="space-y-3">
                                {offersData?.trends?.map((trend) => (
                                    <div key={trend.month} className="flex items-center justify-between">
                                        <span className="text-sm">
                                            {new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xs text-green-600">{trend.won_offers} won</span>
                                            <span className="text-xs text-red-600">{trend.lost_offers} lost</span>
                                            <span className="text-xs text-yellow-600">{trend.pending_offers} pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Performance Metrics */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {applicationsData?.summary?.overall_approval_rate || 0}%
                                </div>
                                <p className="text-sm text-gray-600">Application Approval Rate</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {offersData?.summary?.overall_win_rate || 0}%
                                </div>
                                <p className="text-sm text-gray-600">Offer Win Rate</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {applicationsData?.processing_time?.avg_processing_days || 0}
                                </div>
                                <p className="text-sm text-gray-600">Avg Processing Days</p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
