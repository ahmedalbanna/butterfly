'use client';

import { useEffect, useState } from 'react';
import { getAllProductsForAdmin, createProduct, updateProduct, deleteProduct, toggleProductFeatured, publishProductToSocial, getSocialMediaPosts, generateModelPhoto, saveProductModelImage, deleteProductModelImage } from '@/app/actions/admin-products';
import { getCategories } from '@/app/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Star, Package, Share2, Clock, CheckCircle2, XCircle, User, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, Category, SocialMediaPost } from '@prisma/client';
import Image from 'next/image';

type ProductWithCategory = Product & { category: { name: string } };

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
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
          toast({
            title: 'Success',
            description: 'Product updated successfully'
          });
        }
      } else {
        const result = await createProduct(productData);
        if (result) {
          toast({
            title: 'Success',
            description: 'Product created successfully'
          });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive'
      });
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
      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFeatured = async (product: ProductWithCategory) => {
    const result = await toggleProductFeatured(product.id);
    if (result) {
      toast({
        title: 'Success',
        description: `Product ${result.featured ? 'featured' : 'unfeatured'}`
      });
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
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
        toast({
          title: 'Success',
          description: 'Model photo generated successfully!',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate model photo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Products</h1>
          <p className="text-sm text-white/60 uppercase tracking-wider">Manage luxury collection</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline italic text-primary">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-black/40 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Category</label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="bg-black/40 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Stock</label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="bg-black/40 border-white/20 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Materials</label>
                <Input
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Care Instructions</label>
                <Input
                  value={formData.care}
                  onChange={(e) => setFormData({ ...formData, care: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Primary Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Additional Images (comma-separated URLs)</label>
                <Input
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="https://..., https://..."
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Video URL (Optional)</label>
                <Input
                  value={formData.video}
                  onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  placeholder="https://... (MP4, WebM format)"
                />
                <p className="text-xs text-white/40 mt-1">Add a product video to display instead of images on the homepage</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black/40"
                />
                <label htmlFor="featured" className="text-sm text-white/80">Featured Product</label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80 text-white">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Product</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Category</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Price</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Stock</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">Status</th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-white/60 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded overflow-hidden relative shrink-0">
                          {product.image && (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-headline text-white">{product.name}</p>
                          <p className="text-xs text-white/40 line-clamp-1">{product.materials}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{product.category.name}</td>
                    <td className="px-6 py-4 text-primary font-bold">${product.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-white/60">{product.stock}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleFeatured(product)}
                        className="group"
                      >
                        {product.featured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary border border-primary/30">
                            <Star className="w-3 h-3 fill-current" />
                            Featured
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/5 text-white/40 border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                            <Star className="w-3 h-3" />
                            Regular
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenModelPhotoDialog(product)}
                          className="h-8 w-8 text-white/60 hover:text-purple-400 hover:bg-purple-400/10"
                          title="Generate Model Photo"
                        >
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(product)}
                          className="h-8 w-8 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                        >
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
        <DialogContent className="bg-[#0a0a0a] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline italic text-primary">
              Generate Model Photo
            </DialogTitle>
          </DialogHeader>
          
          {modelPhotoProduct && (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded overflow-hidden relative shrink-0">
                  {modelPhotoProduct.image && (
                    <Image src={modelPhotoProduct.image} alt={modelPhotoProduct.name} fill className="object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-headline text-white">{modelPhotoProduct.name}</p>
                  <p className="text-sm text-white/60">{modelPhotoProduct.category.name}</p>
                  <p className="text-xs text-white/40 mt-1">AI will generate a luxury model photo showing this accessory being worn</p>
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold">Photography Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['luxury', 'elegant', 'editorial', 'casual'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-3 rounded-lg border text-sm capitalize transition-all ${
                        selectedStyle === style
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-primary/30'
                      }`}
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
