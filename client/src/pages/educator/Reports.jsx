import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Users, BookOpen, GraduationCap, DollarSign, TrendingUp, Download, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Reports = () => {
  const { api, currency } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('30days');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showExportOptions, setShowExportOptions] = useState(false);

  const getQueryString = useCallback(() => {
    let startDate = '';
    let endDate = new Date().toISOString();

    if (filterType === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString();
    } else if (filterType === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString();
    } else if (filterType === 'custom') {
      startDate = customDates.start ? new Date(customDates.start).toISOString() : '';
      endDate = customDates.end ? new Date(customDates.end).toISOString() : new Date().toISOString();
    }

    return `?startDate=${startDate}&endDate=${endDate}`;
  }, [filterType, customDates]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reports/summary${getQueryString()}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [api, getQueryString]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/reports/export/${format}${getQueryString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportOptions(false);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
    }
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!data) return <div className="p-10 text-center">Failed to load report data.</div>;

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-500 mt-1">Detailed performance metrics and data exports</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Section */}
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              {['7days', '30days', 'custom'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filterType === f 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f === '7days' ? '7 Days' : f === '30days' ? '30 Days' : 'Custom'}
                </button>
              ))}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 text-gray-700 font-semibold transition-all"
              >
                <Download size={18} />
                Export
                <ChevronDown size={16} />
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden">
                  <button 
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button 
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {filterType === 'custom' && (
          <div className="flex gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Date</label>
              <input 
                type="date" 
                value={customDates.start}
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Date</label>
              <input 
                type="date" 
                value={customDates.end}
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={fetchReportData}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-black transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard title="Users" value={data.totalUsers} icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
          <MetricCard title="Courses" value={data.totalCourses} icon={<BookOpen />} color="text-green-600" bg="bg-green-50" />
          <MetricCard title="Enrollments" value={data.totalEnrollments} icon={<GraduationCap />} color="text-purple-600" bg="bg-purple-50" />
          <MetricCard title="Revenue" value={`${currency}${data.revenue.toLocaleString()}`} icon={<DollarSign />} color="text-amber-600" bg="bg-amber-50" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              User Growth Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Course Popularity</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.courseStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="title" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="enrollmentCount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-8">Category Distribution</h3>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="h-72 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={5} dataKey="value"
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 md:w-1/2">
              {data.categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                  <span className="text-sm font-bold text-gray-400">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-blue-100 transition-colors">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${bg} ${color}`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
  </div>
);

export default Reports;
