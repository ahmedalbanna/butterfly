'use client';

import { useEffect, useState } from 'react';
import { getAllProductsForAdmin, createProduct, updateProduct, deleteProduct, toggleProductFeatured, publishProductToSocial, getSocialMediaPosts, generateModelPhoto, saveProductModelImage, deleteProductModelImage, updateProductStock } from '@/app/actions/admin-products';
import { getCategories } from '@/app/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, Package, Share2, User, Loader2, X, Search, Filter, AlertTriangle, TrendingUp, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, Category, SocialMediaPost } from '@prisma/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

type ProductWithCategory = Product & { category: { name: string } };

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: 0,
    description: '',
    materials: '',
    care: '',
    image: '',
    images: '',
    video: '',
    featured: false,
    stock: 100
  });

  // Social media publishing state
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [publishingProduct, setPublishingProduct] = useState<ProductWithCategory | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [socialPosts, setSocialPosts] = useState<Record<string, SocialMediaPost[]>>({});

  // Model photo generation state
  const [isModelPhotoDialogOpen, setIsModelPhotoDialogOpen] = useState(false);
  const [modelPhotoProduct, setModelPhotoProduct] = useState<ProductWithCategory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'elegant' | 'casual' | 'editorial' | 'luxury'>('luxury');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [productsData, categoriesData] = await Promise.all([
      getAllProductsForAdmin(),
      getCategories()
    ]);
    setProducts(productsData);
    setCategories(categoriesData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        images: formData.images ? formData.images.split(',').map(url => url.trim()) : [formData.image]
      };

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);
        if (result) {
          toast({ title: 'Success', description: 'Product updated successfully' });
        }
      } else {
        const result = await createProduct(productData);
        if (result) {
          toast({ title: 'Success', description: 'Product created successfully' });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
    }
  };

  const handleEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      description: product.description,
      materials: product.materials,
      care: product.care,
      image: product.image,
      images: product.images.join(', '),
      video: product.video || '',
      featured: product.featured,
      stock: product.stock
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (product: ProductWithCategory) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    const result = await deleteProduct(product.id);
    if (result.success) {
      toast({ title: 'Success', description: 'Product deleted successfully' });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete product', variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (product: ProductWithCategory) => {
    const result = await toggleProductFeatured(product.id);
    if (result) {
      toast({ title: 'Success', description: `Product ${result.featured ? 'featured' : 'unfeatured'}` });
      loadData();
    }
  };

  const handleQuickStockUpdate = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    const result = await updateProductStock(productId, newStock);
    if (result) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      if (newStock < 10) {
        toast({ title: 'Stock Alert', description: `Warning: Stock is low (${newStock} units)`, variant: 'destructive' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', categoryId: '', price: 0, description: '', materials: '', care: '', image: '', images: '', video: '', featured: false, stock: 100
    });
    setEditingProduct(null);
  };

  // Social media handlers
  const handleOpenSocialDialog = async (product: ProductWithCategory) => {
    setPublishingProduct(product);
    setSelectedPlatforms([]);
    setIsSocialDialogOpen(true);
    
    // Load existing posts for this product
    const posts = await getSocialMediaPosts(product.id);
    setSocialPosts({ [product.id]: posts });
  };

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublishToSocial = async () => {
    if (!publishingProduct || selectedPlatforms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one platform',
        variant: 'destructive'
      });
      return;
    }

    setIsPublishing(true);
    const result = await publishProductToSocial(publishingProduct.id, selectedPlatforms);
    setIsPublishing(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: `Publishing to ${selectedPlatforms.length} platform(s)`,
      });
      setIsSocialDialogOpen(false);
      
      // Refresh posts
      const posts = await getSocialMediaPosts(publishingProduct.id);
      setSocialPosts({ [publishingProduct.id]: posts });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to publish',
        variant: 'destructive'
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      pinterest: '📌',
      tiktok: '🎵'
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Model photo generation handlers
  const handleOpenModelPhotoDialog = (product: ProductWithCategory) => {
    setModelPhotoProduct(product);
    setGeneratedImage(null);
    setGeneratedPrompt(null);
    setSelectedStyle('luxury');
    setIsModelPhotoDialogOpen(true);
  };

  const handleGenerateModelPhoto = async () => {
    if (!modelPhotoProduct) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setGeneratedPrompt(null);

    try {
      const result = await generateModelPhoto(modelPhotoProduct.id, selectedStyle);
      if (result.success && result.imageBase64) {
        setGeneratedImage(result.imageBase64);
        setGeneratedPrompt(result.prompt || null);
        toast({ title: 'Success', description: 'Model photo generated successfully!' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to generate model photo', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.materials.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockColor = (stock: number) => {
    if (stock < 5) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (stock < 20) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-green-400 bg-green-400/10 border-green-400/20';
  };
  const handleSaveModelImage = async () => {
    if (!modelPhotoProduct || !generatedImage) return;

    try {
      const result = await saveProductModelImage(modelPhotoProduct.id, generatedImage);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Model image saved to product!',
        });
        setIsModelPhotoDialogOpen(false);
        loadData(); // Refresh products
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save model image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteModelImage = async (productId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this model image?')) return;

    try {
      const result = await deleteProductModelImage(productId, imageUrl);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Model image deleted',
        });
        loadData(); // Refresh products
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete model image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Collection Management</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Luxury Inventory Protocol</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Search pieces..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border-white/10 pl-10 h-12 text-sm rounded-none focus:border-primary/50"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48 h-12 bg-black/40 border-white/10 rounded-none text-[10px] uppercase tracking-widest font-bold">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
              <SelectItem value="all" className="text-[10px] uppercase tracking-widest">All Segments</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-[10px] uppercase tracking-widest">{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-primary hover:bg-white hover:text-primary text-white rounded-none uppercase tracking-widest text-[10px] font-bold px-8">
                <Plus className="w-4 h-4 mr-2" /> Add New Piece
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">
              <DialogHeader>
                <DialogTitle className="text-3xl font-headline italic text-primary">
                  {editingProduct ? 'Refine Piece' : 'Catalogue New Piece'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10 rounded-none h-12" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Segment</label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12">
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Market Price ($)</label>
                    <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="bg-white/5 border-white/10 rounded-none h-12 font-mono" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Current Stock</label>
                    <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 rounded-none h-12 font-mono" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Description</label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/10 rounded-none min-h-[100px] resize-none" required />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Composition & Materials</label>
                  <Input value={formData.materials} onChange={(e) => setFormData({ ...formData, materials: e.target.value })} className="bg-white/5 border-white/10 rounded-none h-12" required />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Visual Assets (Primary URL)</label>
                  <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="bg-white/5 border-white/10 rounded-none h-12" required />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4 accent-primary" />
                  <label htmlFor="featured" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">Mark as Featured Piece</label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <Button type="submit" className="flex-1 h-14 bg-primary hover:bg-white hover:text-primary text-white font-bold uppercase tracking-widest text-[10px] rounded-none">
                    {editingProduct ? 'Finalize Updates' : 'Commit to Catalogue'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 border-white/10 text-white hover:bg-white/5 rounded-none uppercase tracking-widest text-[10px] px-8">
                    Discard
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/40 border-white/10 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Total Collection</p>
              <p className="text-3xl font-headline font-bold text-white">{products.length} Pieces</p>
            </div>
            <Package className="w-8 h-8 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </Card>
        <Card className="bg-black/40 border-white/10 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Low Inventory</p>
              <p className="text-3xl font-headline font-bold text-orange-400">{products.filter(p => p.stock < 20).length} Alerts</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400/40 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </Card>
        <Card className="bg-black/40 border-white/10 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Featured Assets</p>
              <p className="text-3xl font-headline font-bold text-blue-400">{products.filter(p => p.featured).length} Spotlights</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400/40 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </Card>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="text-center py-32">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 bg-black/20 border border-dashed border-white/10">
          <p className="text-white/40 italic font-headline text-2xl">No luxury assets found in this segment</p>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/60 border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  <th className="px-6 py-5">Luxury Piece</th>
                  <th className="px-6 py-5">Segment</th>
                  <th className="px-6 py-5">Market Value</th>
                  <th className="px-6 py-5">Inventory Health</th>
                  <th className="px-6 py-5">Catalogue Status</th>
                  <th className="px-6 py-5 text-right">Operational Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-16 bg-white/5 rounded-sm overflow-hidden relative shrink-0 shadow-xl border border-white/5 group-hover:border-primary/30 transition-all">
                          {product.image && <Image src={product.image} alt={product.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />}
                        </div>
                        <div>
                          <p className="font-headline text-lg italic text-white group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] line-clamp-1 max-w-[200px]">{product.materials}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="outline" className="rounded-none border-white/10 text-[9px] tracking-widest uppercase font-bold text-white/60">
                        {product.category.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-white font-bold font-mono text-sm">${product.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <Badge className={cn("rounded-none text-[9px] uppercase tracking-widest font-bold border-none h-6 px-3", getStockColor(product.stock))}>
                          {product.stock} units
                        </Badge>
                        <div className="flex items-center border border-white/10 rounded-none bg-black/40 overflow-hidden h-8">
                          <button onClick={() => handleQuickStockUpdate(product.id, product.stock, -1)} className="px-2 hover:bg-white/10 text-white/40">-</button>
                          <span className="w-8 text-center text-[10px] font-bold text-white/60">{product.stock}</span>
                          <button onClick={() => handleQuickStockUpdate(product.id, product.stock, 1)} className="px-2 hover:bg-white/10 text-white/40">+</button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button onClick={() => handleToggleFeatured(product)} className="group/star">
                        {product.featured ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none text-[9px] uppercase tracking-widest font-bold bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                            <Star className="w-3 h-3 fill-current" /> Spotlight
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none text-[9px] uppercase tracking-widest font-bold bg-white/5 text-white/20 border border-white/5 group-hover/star:border-primary/30 group-hover/star:text-primary transition-all">
                            <Star className="w-3 h-3" /> Standard
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenModelPhotoDialog(product)} className="h-9 w-9 text-white/40 hover:text-purple-400 hover:bg-purple-400/10 rounded-none">
                          <User className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenSocialDialog(product)}
                          className="h-8 w-8 text-white/60 hover:text-blue-400 hover:bg-blue-400/10"
                          title="Share to Social Media"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 text-white/60 hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(product)} className="h-9 w-9 text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-none">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Photo Generation Dialog */}
      <Dialog open={isModelPhotoDialogOpen} onOpenChange={setIsModelPhotoDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline italic text-primary">AI Visual Stylist</DialogTitle>
          </DialogHeader>
          {modelPhotoProduct && (
            <div className="space-y-8 py-4">
              <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/5 rounded-none">
                <div className="w-20 h-24 bg-white/5 rounded-sm overflow-hidden relative shrink-0">
                  {modelPhotoProduct.image && <Image src={modelPhotoProduct.image} alt={modelPhotoProduct.name} fill className="object-cover" />}
                </div>
                <div>
                  <p className="font-headline text-2xl italic text-white mb-1">{modelPhotoProduct.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{modelPhotoProduct.category.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Artistic Photography Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['luxury', 'elegant', 'editorial', 'casual'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={cn(
                        "py-4 rounded-none border text-[10px] uppercase tracking-[0.2em] font-bold transition-all",
                        selectedStyle === style ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-white/40 hover:border-primary/30"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing Model Images */}
              {modelPhotoProduct.modelImages && modelPhotoProduct.modelImages.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold">Existing Model Photos</label>
                  <div className="grid grid-cols-3 gap-3">
                    {modelPhotoProduct.modelImages.map((imageUrl, index) => (
                      <div key={index} className="relative group aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        <Image src={imageUrl} alt={`Model ${index + 1}`} fill className="object-cover" />
                        <button
                          onClick={() => handleDeleteModelImage(modelPhotoProduct.id, imageUrl)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateModelPhoto}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/80 text-white disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... (this may take 30-60 seconds)
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Generate Model Photo
                  </>
                )}
              </Button>

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold">Generated Image</label>
                  <div className="relative aspect-square bg-white/5 rounded-lg overflow-hidden border border-primary/30">
                    <Image 
                      src={generatedImage.startsWith('data:') ? generatedImage : `data:image/png;base64,${generatedImage}`} 
                      alt="Generated model photo" 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  {generatedPrompt && (
                    <p className="text-xs text-white/40 italic">Prompt: {generatedPrompt}</p>
                  )}
                  
                  {/* Save/Regenerate Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveModelImage}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save to Product
                    </Button>
                    <Button
                      onClick={handleGenerateModelPhoto}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {/* Close Button */}
              {!generatedImage && (
                <Button
                  variant="outline"
                  onClick={() => setIsModelPhotoDialogOpen(false)}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Social Media Publishing Dialog */}
      <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline italic text-primary">
              Share to Social Media
            </DialogTitle>
          </DialogHeader>
          
          {publishingProduct && (
            <div className="space-y-6">
              {/* Product Preview */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded overflow-hidden relative shrink-0">
                  {publishingProduct.image && (
                    <Image src={publishingProduct.image} alt={publishingProduct.name} fill className="object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-headline text-white">{publishingProduct.name}</p>
                  <p className="text-sm text-white/60">${publishingProduct.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold">Select Platforms</label>
                {['facebook', 'instagram', 'twitter', 'pinterest', 'tiktok'].map((platform) => (
                  <div key={platform} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-primary/30 transition-colors">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => handleTogglePlatform(platform)}
                      className="border-white/20"
                    />
                    <label htmlFor={platform} className="flex items-center gap-2 text-sm text-white cursor-pointer flex-1">
                      <span className="text-lg">{getPlatformIcon(platform)}</span>
                      <span className="capitalize">{platform}</span>
                    </label>
                    {socialPosts[publishingProduct.id]?.find(p => p.platform === platform) && (
                      <div className="flex items-center gap-1">
                        {getStatusIcon(socialPosts[publishingProduct.id].find(p => p.platform === platform)!.status)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Existing Posts */}
              {socialPosts[publishingProduct.id]?.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold">Recent Posts</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {socialPosts[publishingProduct.id].map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-2 bg-white/5 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getPlatformIcon(post.platform)}</span>
                          <span className="capitalize text-white/60">{post.platform}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(post.status)}
                          <span className="text-white/40">{post.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePublishToSocial}
                  disabled={isPublishing || selectedPlatforms.length === 0}
                  className="flex-1 bg-primary hover:bg-primary/80 text-white disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : `Publish to ${selectedPlatforms.length} Platform(s)`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSocialDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
