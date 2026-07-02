import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, DollarSign, TrendingUp, Download, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState, ErrorState } from '../../components/ui/empty-state';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
    if (filterType === '7days') { const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString(); }
    else if (filterType === '30days') { const d = new Date(); d.setDate(d.getDate() - 30); startDate = d.toISOString(); }
    else if (filterType === 'custom') { startDate = customDates.start ? new Date(customDates.start).toISOString() : ''; if (customDates.end) endDate = new Date(customDates.end).toISOString(); }
    return `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  }, [filterType, customDates]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/educator/reports${getQueryString()}`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setData(null);
    } finally { setLoading(false); }
  }, [api, getQueryString]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/educator/reports/export${getQueryString()}&format=${format}`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `report.${format}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Export failed:', err); }
    setShowExportOptions(false);
  };

  const filterOptions = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' },
  ];

  const totalStudents = data?.totalStudents || 0;
  const totalCourses = data?.totalCourses || 0;
  const totalRevenue = data?.totalRevenue || 0;
  const growthRate = data?.growthRate || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your performance and growth</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={filterOptions}
            />
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowExportOptions(!showExportOptions)}>
              <Download size={14} /> Export <ChevronDown size={12} />
            </Button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-border bg-card shadow-lg z-10 animate-scale-in">
                <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">CSV</button>
                <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filterType === 'custom' && (
        <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Start Date</label>
            <input type="date" value={customDates.start} onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">End Date</label>
            <input type="date" value={customDates.end} onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <Button size="sm" onClick={fetchReports} className="mt-5">Apply</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
          <Skeleton variant="card" className="h-80" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card variant="default" padding="md">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary"><Users size={24} /></div>
                <div><p className="text-2xl font-bold text-foreground">{totalStudents}</p><p className="text-sm text-muted-foreground">Students</p></div>
              </div>
            </Card>
            <Card variant="default" padding="md">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10 text-success"><BookOpen size={24} /></div>
                <div><p className="text-2xl font-bold text-foreground">{totalCourses}</p><p className="text-sm text-muted-foreground">Courses</p></div>
              </div>
            </Card>
            <Card variant="default" padding="md">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10 text-warning"><DollarSign size={24} /></div>
                <div><p className="text-2xl font-bold text-foreground">{currency}{totalRevenue.toFixed(2)}</p><p className="text-sm text-muted-foreground">Revenue</p></div>
              </div>
            </Card>
            <Card variant="default" padding="md">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${growthRate >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}><TrendingUp size={24} /></div>
                <div><p className="text-2xl font-bold text-foreground">{growthRate >= 0 ? '+' : ''}{growthRate}%</p><p className="text-sm text-muted-foreground">Growth</p></div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="default" padding="md">
              <CardTitle className="text-base mb-4">Enrollments Over Time</CardTitle>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.enrollmentTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card variant="default" padding="md">
              <CardTitle className="text-base mb-4">Revenue Over Time</CardTitle>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card variant="default" padding="md">
              <CardTitle className="text-base mb-4">Course Distribution</CardTitle>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.courseDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {(data?.courseDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                {(data?.courseDistribution || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="default" padding="md">
              <CardTitle className="text-base mb-4">Recent Activity</CardTitle>
              <div className="space-y-3">
                {(data?.recentActivity || []).length > 0 ? (
                  data.recentActivity.slice(0, 8).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className={`p-1.5 rounded-full ${activity.type === 'enrollment' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                        {activity.type === 'enrollment' ? <Users size={12} /> : <BookOpen size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <ErrorState title="No report data" description="No data available for the selected period." onRetry={fetchReports} />
      )}
    </div>
  );
};

export default Reports;
