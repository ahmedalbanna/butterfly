import { getAllProductsForAdmin } from '@/app/actions/admin-products';
import { getCategoriesWithCounts } from '@/app/actions/categories';
import { getOrderStats } from '@/app/actions/admin-orders';
import { Package, FolderTree, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const [products, categories, orderStats] = await Promise.all([
    getAllProductsForAdmin(),
    getCategoriesWithCounts(),
    getOrderStats()
  ]);

  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      description: 'Luxury items in collection',
      color: 'text-blue-400'
    },
    {
      title: 'Categories',
      value: categories.length,
      icon: FolderTree,
      description: 'Product categories',
      color: 'text-purple-400'
    },
    {
      title: 'Total Orders',
      value: orderStats.total,
      icon: ShoppingCart,
      description: `${orderStats.pending} pending`,
      color: 'text-primary'
    },
    {
      title: 'Revenue',
      value: `$${orderStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Total revenue',
      color: 'text-green-400'
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-headline italic text-white mb-2">Dashboard</h1>
        <p className="text-sm text-white/60 uppercase tracking-wider">Overview of your luxury boutique</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-headline font-bold text-white mb-1">{stat.value}</div>
                <p className="text-xs text-white/40">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Overview */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-headline italic text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div>
                    <p className="font-headline text-white">{category.name}</p>
                    <p className="text-xs text-white/40">{category.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{category.productCount}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Products</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Overview */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-headline italic text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Pending', value: orderStats.pending, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                { label: 'Confirmed', value: orderStats.confirmed, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                { label: 'Shipped', value: orderStats.shipped, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
                { label: 'Delivered', value: orderStats.delivered, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                { label: 'Cancelled', value: orderStats.cancelled, color: 'bg-red-500/20 text-red-400 border-red-500/30' }
              ].map((status) => (
                <div key={status.label} className="flex items-center justify-between p-3 rounded-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0].replace('bg-', 'bg-').replace('/20', '')}`} />
                    <p className="font-headline text-white">{status.label}</p>
                  </div>
                  <div className="text-2xl font-bold text-white">{status.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-xl font-headline italic text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Recent Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-3 text-xs uppercase tracking-wider text-white/60 font-bold">Name</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-white/60 font-bold">Category</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-white/60 font-bold">Price</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-white/60 font-bold">Stock</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-white/60 font-bold">Featured</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 font-headline text-white">{product.name}</td>
                    <td className="py-3 text-white/60">{product.category.name}</td>
                    <td className="py-3 text-primary font-bold">${product.price.toLocaleString()}</td>
                    <td className="py-3 text-white/60">{product.stock}</td>
                    <td className="py-3">
                      {product.featured ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary border border-primary/30">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/5 text-white/40 border border-white/10">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
