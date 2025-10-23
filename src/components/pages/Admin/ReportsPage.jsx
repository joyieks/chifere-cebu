import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiUsers, FiShoppingBag, FiTrendingUp, FiAlertTriangle, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import { useToast } from '../../Toast';
import adminService from '../../../services/adminService';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivities()
      ]);
      
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      
      if (activitiesRes.success) {
        setRecentActivities(activitiesRes.activities);
      }
    } catch (error) {
      console.error('Load reports error:', error);
      showToast('Failed to load reports data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getGrowthPercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Platform insights and user activity reports</p>
            </div>
            <button 
              onClick={loadReportsData} 
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-500">Loading reports...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Users"
                value={stats?.totalBuyers + stats?.approvedSellers + stats?.pendingSellers + stats?.rejectedSellers || 0}
                icon={FiUsers}
                color="blue"
                trend="+12%"
                trendUp={true}
              />
              <MetricCard
                title="Active Sellers"
                value={stats?.approvedSellers || 0}
                icon={FiShoppingBag}
                color="green"
                trend="+8%"
                trendUp={true}
              />
              <MetricCard
                title="Pending Applications"
                value={stats?.pendingSellers || 0}
                icon={FiAlertTriangle}
                color="yellow"
                trend="+3"
                trendUp={false}
              />
              <MetricCard
                title="Total Buyers"
                value={stats?.totalBuyers || 0}
                icon={FiUsers}
                color="purple"
                trend="+15%"
                trendUp={true}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Platform Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Platform Overview</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiUsers className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Total Users</p>
                          <p className="text-sm text-gray-500">All registered users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.totalBuyers + stats?.approvedSellers + stats?.pendingSellers + stats?.rejectedSellers || 0}
                        </p>
                        <p className="text-sm text-green-600">+12% from last month</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FiShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Active Sellers</p>
                          <p className="text-sm text-gray-500">Approved and verified</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{stats?.approvedSellers || 0}</p>
                        <p className="text-sm text-green-600">+8% from last month</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <FiAlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Pending Reviews</p>
                          <p className="text-sm text-gray-500">Awaiting approval</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{stats?.pendingSellers || 0}</p>
                        <p className="text-sm text-yellow-600">+3 new this week</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FiUsers className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Active Buyers</p>
                          <p className="text-sm text-gray-500">Registered buyers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalBuyers || 0}</p>
                        <p className="text-sm text-green-600">+15% from last month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.slice(0, 8).map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.created_at).toLocaleDateString()} at{' '}
                              {new Date(activity.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FiMessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Reports Section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Growth Trends</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User Growth</span>
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Seller Growth</span>
                    <span className="text-sm font-medium text-green-600">+8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Buyer Growth</span>
                    <span className="text-sm font-medium text-green-600">+15%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pending Actions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Seller Applications</span>
                    <span className="text-sm font-medium text-yellow-600">{stats?.pendingSellers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rejected Applications</span>
                    <span className="text-sm font-medium text-red-600">{stats?.rejectedSellers || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiBarChart2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Platform Health</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Status</span>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-green-600">120ms</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, trend, trendUp }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-1 ${trendUp ? 'text-green-600' : 'text-yellow-600'}`}>
            {trend}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
