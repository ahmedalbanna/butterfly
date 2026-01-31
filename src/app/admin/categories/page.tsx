'use client';

import { useEffect, useState } from 'react';
import { getCategoriesWithCounts, createCategory, updateCategory, deleteCategory } from '@/app/actions/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FolderTree, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@prisma/client';

type CategoryWithCount = Category & { productCount: number };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    const data = await getCategoriesWithCounts();
    setCategories(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, formData);
        if (result) {
          toast({
            title: 'Success',
            description: 'Category updated successfully'
          });
        }
      } else {
        const result = await createCategory(formData);
        if (result) {
          toast({
            title: 'Success',
            description: 'Category created successfully'
          });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      displayOrder: category.displayOrder
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: CategoryWithCount) => {
    if (category.productCount > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This category has ${category.productCount} products. Remove them first.`,
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    const result = await deleteCategory(category.id);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
      loadCategories();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      displayOrder: 0
    });
    setEditingCategory(null);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-headline italic text-white mb-2">Categories</h1>
          <p className="text-sm text-white/60 uppercase tracking-wider">Manage product categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline italic text-primary">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ ...formData, name, slug: generateSlug(name) });
                  }}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-black/40 border-white/20 text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2 block">Display Order</label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="bg-black/40 border-white/20 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80 text-white">
                  {editingCategory ? 'Update' : 'Create'}
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

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-primary" />
                    <span className="font-headline text-xl text-white">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(category)}
                      className="h-8 w-8 text-white/60 hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(category)}
                      className="h-8 w-8 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                      disabled={category.productCount > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60 mb-4 italic">{category.description || 'No description'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/40">
                    <Package className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Products</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{category.productCount}</span>
                </div>
                <div className="mt-2 text-xs text-white/40">
                  <span className="font-mono">/{category.slug}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
