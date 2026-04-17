import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  ShoppingBag, 
  Wallet, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 5000 },
  { name: 'May', value: 3500 },
  { name: 'Jun', value: 4500 },
];

const pieData = [
  { name: 'Cash', value: 400 },
  { name: 'Transfer', value: 300 },
  { name: 'QRIS', value: 300 },
];

const COLORS = ['#F97316', '#FDBA74', '#FFEDD5'];

const stats = [
  { label: 'Total Revenue', value: '$45,500', trend: 10.5, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Total Orders', value: '1,240', trend: 15.2, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Users', value: '850', trend: 3.5, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Avg. Sale', value: '$36.7', trend: -2.1, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function OverviewPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Monitor your business performance and metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-3xl group hover:shadow-md transition-all duration-300 overflow-hidden relative">
             {/* Gradient Accent Overlay */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-tr from-gray-50 to-orange-500`} />
            
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className={stat.bg + " p-3 rounded-2xl"}>
                  <stat.icon className={stat.color + " w-6 h-6"} />
                </div>
                <MoreVertical className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className="flex items-end justify-between mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stat.trend)}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-2">v0.5% From last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8 pt-8 px-8">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Sales Overview</CardTitle>
              <CardDescription>Monthly revenue tracking</CardDescription>
            </div>
            <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
            </select>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                 />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#F97316', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#F97316" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pt-8 px-8">
             <CardTitle className="text-lg font-bold tracking-tight">Payment Method</CardTitle>
             <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold">1,000</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full mt-6">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] font-bold text-gray-500">{entry.name}</span>
                  </div>
                  <span className="text-xs font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
         <CardHeader className="flex flex-row items-center justify-between px-8 py-8">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Recent Orders</CardTitle>
            <CardDescription>Manage and track latest processing orders</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl border-gray-100 font-bold text-xs h-9">View All</Button>
        </CardHeader>
        <CardContent className="px-4 pb-8">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50">
                <TableHead className="w-[80px] font-bold text-gray-400 text-[10px] uppercase tracking-wider">No</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Customer</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                  <TableCell className="font-medium text-gray-600">{i}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                        {String.fromCharCode(64 + i)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Customer {String.fromCharCode(64 + i)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">customer_{i}@example.com</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-900">$ {125 * i}.00</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 border-none font-bold text-[10px] py-0.5 rounded-lg px-2">
                       Success
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
