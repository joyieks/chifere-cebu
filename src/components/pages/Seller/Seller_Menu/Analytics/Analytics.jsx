import React, { useState } from 'react';
import SellerLayout from '../Seller_Layout/SellerLayout';
import { theme } from '../../../../../styles/designSystem';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiEye, 
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiBarChart2
} from 'react-icons/fi';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Mock analytics data
  const analyticsData = {
    '7d': {
      revenue: 25450,
      orders: 12,
      views: 345,
      conversion: 3.5,
      topProducts: [
        { name: 'MacBook Pro 13"', sales: 2, revenue: 15000 },
        { name: 'Vintage Jacket', sales: 3, revenue: 7500 },
        { name: 'Samsung Watch', sales: 1, revenue: 2950 }
      ]
    },
    '30d': {
      revenue: 127850,
      orders: 47,
      views: 1847,
      conversion: 2.5,
      topProducts: [
        { name: 'MacBook Pro 13"', sales: 8, revenue: 68990 },
        { name: 'Vintage Leather Jacket', sales: 12, revenue: 30000 },
        { name: 'Samsung Galaxy Watch', sales: 5, revenue: 28860 }
      ]
    },
    '90d': {
      revenue: 287340,
      orders: 89,
      views: 4523,
      conversion: 2.0,
      topProducts: [
        { name: 'MacBook Pro 13"', sales: 15, revenue: 135000 },
        { name: 'Vintage Items', sales: 28, revenue: 87000 },
        { name: 'Electronics', sales: 18, revenue: 65340 }
      ]
    }
  };

  const currentData = analyticsData[timeRange];

  const StatCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }) => (
    <div className="card-base p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <FiTrendingUp className={`w-4 h-4 mr-1 ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                {changeType === 'positive' ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
             style={{ backgroundColor: theme.colors[color][100] }}>
          <Icon className="w-6 h-6" style={{ color: theme.colors[color][500] }} />
        </div>
      </div>
    </div>
  );

  const ProductRow = ({ product, index }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
             style={{ backgroundColor: theme.colors.primary[100], color: theme.colors.primary[600] }}>
          {index + 1}
        </div>
        <div>
          <p className="font-medium text-gray-800">{product.name}</p>
          <p className="text-sm text-gray-600">{product.sales} sales</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold" style={{ color: theme.colors.success[600] }}>
          ₱{product.revenue.toLocaleString()}
        </p>
      </div>
    </div>
  );

  // Mock chart data for visual representation
  const chartData = [
    { period: 'Week 1', revenue: 15000, orders: 8 },
    { period: 'Week 2', revenue: 22000, orders: 12 },
    { period: 'Week 3', revenue: 35000, orders: 15 },
    { period: 'Week 4', revenue: 28000, orders: 12 },
  ];

  const SimpleBarChart = ({ data }) => (
    <div className="flex items-end space-x-4 h-40 mt-6">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full flex flex-col items-center">
            <div 
              className="w-8 rounded-t-md transition-all duration-500"
              style={{ 
                height: `${(item.revenue / 40000) * 120}px`,
                backgroundColor: theme.colors.primary[500],
                minHeight: '20px'
              }}
            />
            <p className="text-xs text-gray-600 mt-2 text-center">{item.period}</p>
            <p className="text-xs font-medium text-gray-800">₱{(item.revenue / 1000).toFixed(0)}k</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <SellerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Time Range Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-base min-w-[120px]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="btn-base btn-md btn-outline">
              <FiCalendar className="w-4 h-4 mr-2" />
              Custom Range
            </button>
          </div>
        </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FiDollarSign}
              title="Total Revenue"
              value={`₱${currentData.revenue.toLocaleString()}`}
              change={15.3}
              changeType="positive"
              color="success"
            />
            <StatCard
              icon={FiShoppingCart}
              title="Total Orders"
              value={currentData.orders}
              change={8.2}
              changeType="positive"
              color="primary"
            />
            <StatCard
              icon={FiEye}
              title="Total Views"
              value={currentData.views.toLocaleString()}
              change={12.5}
              changeType="positive"
              color="info"
            />
            <StatCard
              icon={FiBarChart2}
              title="Conversion Rate"
              value={`${currentData.conversion}%`}
              change={-2.1}
              changeType="negative"
              color="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Revenue Trend</h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary[500] }}></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                </div>
              </div>
              <SimpleBarChart data={chartData} />
            </div>

            {/* Top Products */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Top Performing Products</h2>
                <button className="text-sm font-medium" style={{ color: theme.colors.primary[500] }}>
                  View All
                </button>
              </div>
              <div className="space-y-1">
                {currentData.topProducts.map((product, index) => (
                  <ProductRow key={product.name} product={product} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Customer Insights */}
            <div className="card-base p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Insights</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Customers</span>
                  <span className="font-semibold text-gray-800">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Returning Customers</span>
                  <span className="font-semibold text-gray-800">15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-green-600">4.8/5</span>
                </div>
              </div>
            </div>

            {/* Product Performance */}
            <div className="card-base p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Product Performance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-semibold text-gray-800">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Listings</span>
                  <span className="font-semibold text-gray-800">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Product Views</span>
                  <span className="font-semibold text-gray-800">127</span>
                </div>
              </div>
            </div>

            {/* Sales Channels */}
            <div className="card-base p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Sales Channels</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Direct Sales</span>
                  <span className="font-semibold text-gray-800">65%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Barter Trades</span>
                  <span className="font-semibold text-orange-600">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Referrals</span>
                  <span className="font-semibold text-gray-800">10%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
    </SellerLayout>
  );
};

export default Analytics;