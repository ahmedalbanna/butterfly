'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Sparkles, CheckCircle2, RefreshCw, X, Check, Eye, Trash2, Image as ImageIcon, Wand2, TrendingUp } from 'lucide-react';
import { generateProductFromImage, generateProductsFromMultipleImages } from '@/app/actions/admin-products';
import { createProduct } from '@/app/actions/admin-products';
import { useToast } from '@/hooks/use-toast';

type ProductDraftStatus = 'pending' | 'analyzing' | 'analyzed' | 'accepted' | 'failed';

type ProductDraft = {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  status: ProductDraftStatus;
  aiData?: {
    name: string;
    description: string;
    category: string;
    suggestedPrice?: number;
    imageUrl: string;
  };
  editedData?: {
    name: string;
    description: string;
    categoryId: string;
    price: string;
    materials: string;
    care: string;
  };
  error?: string;
};

export default function AIProductCreatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [productDrafts, setProductDrafts] = useState<ProductDraft[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newDrafts: ProductDraft[] = files.map((file, index) => ({
      id: `draft-${Date.now()}-${index}`,
      file,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as ProductDraftStatus,
    }));

    setProductDrafts(prev => [...prev, ...newDrafts]);
    
    toast({
      title: `${files.length} Image${files.length > 1 ? 's' : ''} Added`,
      description: 'Click "Analyze All" to process with AI.',
    });
  };

  const handleAnalyzeAll = async () => {
    const pendingDrafts = productDrafts.filter(d => d.status === 'pending' || d.status === 'failed');
    
    if (pendingDrafts.length === 0) {
      toast({
        title: 'No Images to Analyze',
        description: 'All images have been analyzed.',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: pendingDrafts.length });

    setProductDrafts(prev => prev.map(draft => 
      draft.status === 'pending' || draft.status === 'failed'
        ? { ...draft, status: 'analyzing' as ProductDraftStatus }
        : draft
    ));

    try {
      const formData = new FormData();
      pendingDrafts.forEach(draft => {
        formData.append('images', draft.file);
      });

      const result = await generateProductsFromMultipleImages(formData);

      if (result.success && result.results) {
        setProductDrafts(prev => prev.map(draft => {
          const matchingResult = result.results?.find(r => r.fileName === draft.fileName);
          if (matchingResult) {
            if (matchingResult.success && matchingResult.data) {
              return {
                ...draft,
                status: 'analyzed' as ProductDraftStatus,
                aiData: matchingResult.data,
                editedData: {
                  name: matchingResult.data.name,
                  description: matchingResult.data.description,
                  categoryId: getCategoryId(matchingResult.data.category),
                  price: matchingResult.data.suggestedPrice?.toString() || '',
                  materials: '',
                  care: '',
                }
              };
            } else {
              return {
                ...draft,
                status: 'failed' as ProductDraftStatus,
                error: matchingResult.error
              };
            }
          }
          return draft;
        }));

        toast({
          title: 'Analysis Complete! ✨',
          description: `${result.results.filter(r => r.success).length} of ${result.results.length} images analyzed successfully.`,
        });
      } else {
        toast({
          title: 'Analysis Failed',
          description: result.error || 'Could not analyze images.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  const handleReanalyze = async (draftId: string) => {
    const draft = productDrafts.find(d => d.id === draftId);
    if (!draft) return;

    setProductDrafts(prev => prev.map(d => 
      d.id === draftId ? { ...d, status: 'analyzing' as ProductDraftStatus } : d
    ));

    try {
      const formData = new FormData();
      formData.append('image', draft.file);

      const result = await generateProductFromImage(formData);

      if (result.success && result.data) {
        setProductDrafts(prev => prev.map(d => 
          d.id === draftId 
            ? {
                ...d,
                status: 'analyzed' as ProductDraftStatus,
                aiData: result.data,
                editedData: {
                  name: result.data!.name,
                  description: result.data!.description,
                  categoryId: getCategoryId(result.data!.category),
                  price: result.data!.suggestedPrice?.toString() || '',
                  materials: d.editedData?.materials || '',
                  care: d.editedData?.care || '',
                }
              }
            : d
        ));

        toast({
          title: 'Re-analysis Complete!',
          description: 'AI has generated new suggestions.',
        });
      } else {
        setProductDrafts(prev => prev.map(d => 
          d.id === draftId 
            ? { ...d, status: 'failed' as ProductDraftStatus, error: result.error }
            : d
        ));

        toast({
          title: 'Re-analysis Failed',
          description: result.error || 'Could not analyze the image.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error re-analyzing:', error);
      setProductDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, status: 'failed' as ProductDraftStatus } : d
      ));
    }
  };

  const handleAcceptDraft = (draftId: string) => {
    setProductDrafts(prev => prev.map(d => 
      d.id === draftId ? { ...d, status: 'accepted' as ProductDraftStatus } : d
    ));
  };

  const handleAcceptAll = () => {
    setProductDrafts(prev => prev.map(d => 
      d.status === 'analyzed' ? { ...d, status: 'accepted' as ProductDraftStatus } : d
    ));
    
    toast({
      title: 'All Products Accepted',
      description: 'Click "Save All" to create products in database.',
    });
  };

  const handleRemoveDraft = (draftId: string) => {
    setProductDrafts(prev => prev.filter(d => d.id !== draftId));
    toast({
      title: 'Draft Removed',
      description: 'Product draft has been deleted.',
    });
  };

  const handleSaveAll = async () => {
    const acceptedDrafts = productDrafts.filter(d => d.status === 'accepted' && d.editedData);
    
    if (acceptedDrafts.length === 0) {
      toast({
        title: 'No Products to Save',
        description: 'Accept at least one product first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;

    try {
      for (const draft of acceptedDrafts) {
        if (!draft.editedData || !draft.aiData) continue;

        const productData = {
          name: draft.editedData.name,
          categoryId: draft.editedData.categoryId,
          price: parseFloat(draft.editedData.price),
          description: draft.editedData.description,
          materials: draft.editedData.materials,
          care: draft.editedData.care,
          image: draft.aiData.imageUrl,
          images: [draft.aiData.imageUrl],
          featured: false,
          stock: 100,
        };

        const result = await createProduct(productData);
        if (result) {
          successCount++;
        }
      }

      toast({
        title: `${successCount} Product${successCount > 1 ? 's' : ''} Created! 🎉`,
        description: 'Redirecting to products page...',
      });

      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (error) {
      console.error('Error saving products:', error);
      toast({
        title: 'Error',
        description: 'Some products could not be saved.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryId = (categoryName: string): string => {
    const categoryMap: Record<string, string> = {
      'Jewelry': 'cat1',
      'Watches': 'cat2',
      'Bags': 'cat3',
      'Accessories': 'cat4',
    };
    return categoryMap[categoryName] || 'cat4';
  };

  const updateDraftField = (draftId: string, field: keyof ProductDraft['editedData'], value: string) => {
    setProductDrafts(prev => prev.map(d => 
      d.id === draftId && d.editedData
        ? { ...d, editedData: { ...d.editedData, [field]: value } }
        : d
    ));
  };

  const getStatusBadge = (status: ProductDraftStatus) => {
    const variants: Record<ProductDraftStatus, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      analyzing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse', label: 'Analyzing...' },
      analyzed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Analyzed' },
      accepted: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Accepted' },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
    };
    
    const { color, label } = variants[status];
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  const pendingCount = productDrafts.filter(d => d.status === 'pending').length;
  const analyzedCount = productDrafts.filter(d => d.status === 'analyzed').length;
  const acceptedCount = productDrafts.filter(d => d.status === 'accepted').length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl flex items-center justify-center border-2 border-purple-400/40">
            <ImageIcon className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-headline italic text-white mb-2">Batch AI Product Creator</h1>
            <p className="text-sm text-white/60 uppercase tracking-wider">Upload images and let AI generate product details</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Images', value: productDrafts.length, icon: ImageIcon, color: 'text-blue-400' },
          { label: 'Pending', value: pendingCount, icon: Upload, color: 'text-yellow-400' },
          { label: 'Analyzed', value: analyzedCount, icon: Sparkles, color: 'text-green-400' },
          { label: 'Accepted', value: acceptedCount, icon: CheckCircle2, color: 'text-emerald-400' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-black/40 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Section */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-400/20">
        <CardHeader>
          <CardTitle className="text-xl font-headline italic text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Upload Product Images
          </CardTitle>
          <CardDescription className="text-white/60">
            Select multiple high-quality images of your luxury products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              disabled={isAnalyzing || isSaving}
              className="bg-black/40 border-white/20 text-white file:bg-primary/20 file:text-primary file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-lg hover:file:bg-primary/30"
            />
          </div>

          {productDrafts.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center justify-between p-4 bg-black/40 rounded-lg border border-white/10">
              <div className="flex gap-6 text-sm text-white/80">
                <span>Total: <strong className="text-white">{productDrafts.length}</strong></span>
                <span>Pending: <strong className="text-yellow-400">{pendingCount}</strong></span>
                <span>Analyzed: <strong className="text-green-400">{analyzedCount}</strong></span>
                <span>Accepted: <strong className="text-emerald-400">{acceptedCount}</strong></span>
              </div>
              
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <Button
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing || isSaving}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing {analysisProgress.current}/{analysisProgress.total}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze All ({pendingCount})
                      </>
                    )}
                  </Button>
                )}
                
                {analyzedCount > 0 && (
                  <Button
                    onClick={handleAcceptAll}
                    disabled={isAnalyzing || isSaving}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept All ({analyzedCount})
                  </Button>
                )}
                
                {acceptedCount > 0 && (
                  <Button
                    onClick={handleSaveAll}
                    disabled={isAnalyzing || isSaving}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Save All ({acceptedCount})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Drafts Grid */}
      {productDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productDrafts.map((draft) => (
            <Card key={draft.id} className="bg-black/40 border-white/10 hover:border-primary/30 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1 text-white font-headline italic">
                      {draft.aiData?.name || draft.fileName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 text-white/40">{draft.fileName}</CardDescription>
                  </div>
                  {getStatusBadge(draft.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Image Preview */}
                <div className="relative aspect-square w-full border border-white/10 rounded-lg overflow-hidden bg-black/60">
                  <img
                    src={draft.previewUrl}
                    alt={draft.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {draft.status === 'analyzing' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Analyzing...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Data Display */}
                {draft.status === 'analyzed' || draft.status === 'accepted' ? (
                  expandedDraftId === draft.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Product Name</Label>
                        <Input
                          value={draft.editedData?.name || ''}
                          onChange={(e) => updateDraftField(draft.id, 'name', e.target.value)}
                          className="mt-1 bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Description</Label>
                        <Textarea
                          value={draft.editedData?.description || ''}
                          onChange={(e) => updateDraftField(draft.id, 'description', e.target.value)}
                          rows={3}
                          className="mt-1 bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Category</Label>
                          <Select
                            value={draft.editedData?.categoryId || ''}
                            onValueChange={(value) => updateDraftField(draft.id, 'categoryId', value)}
                          >
                            <SelectTrigger className="mt-1 bg-black/40 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/20 text-white">
                              <SelectItem value="cat1">Jewelry</SelectItem>
                              <SelectItem value="cat2">Watches</SelectItem>
                              <SelectItem value="cat3">Bags</SelectItem>
                              <SelectItem value="cat4">Accessories</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={draft.editedData?.price || ''}
                            onChange={(e) => updateDraftField(draft.id, 'price', e.target.value)}
                            className="mt-1 bg-black/40 border-white/20 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Materials</Label>
                        <Input
                          value={draft.editedData?.materials || ''}
                          onChange={(e) => updateDraftField(draft.id, 'materials', e.target.value)}
                          placeholder="e.g., 18k Gold, Diamond"
                          className="mt-1 bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-xs uppercase tracking-wider text-white/60 font-bold">Care Instructions</Label>
                        <Textarea
                          value={draft.editedData?.care || ''}
                          onChange={(e) => updateDraftField(draft.id, 'care', e.target.value)}
                          rows={2}
                          placeholder="e.g., Clean with soft cloth"
                          className="mt-1 bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <Button
                        onClick={() => setExpandedDraftId(null)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-white hover:bg-white/10"
                      >
                        Collapse
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/60 line-clamp-2">
                        {draft.aiData?.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="border-white/20 text-white/80">{draft.aiData?.category}</Badge>
                        <span className="font-semibold text-primary">${draft.editedData?.price || draft.aiData?.suggestedPrice}</span>
                      </div>
                      <Button
                        onClick={() => setExpandedDraftId(draft.id)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-white hover:bg-white/10"
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        Expand & Edit
                      </Button>
                    </div>
                  )
                ) : draft.status === 'failed' ? (
                  <div className="text-xs text-red-400 p-3 bg-red-500/10 rounded border border-red-500/20">
                    {draft.error || 'Analysis failed'}
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {(draft.status === 'analyzed' || draft.status === 'failed') && (
                    <Button
                      onClick={() => handleReanalyze(draft.id)}
                      disabled={isAnalyzing || isSaving}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Re-analyze
                    </Button>
                  )}
                  
                  {draft.status === 'analyzed' && (
                    <Button
                      onClick={() => handleAcceptDraft(draft.id)}
                      disabled={isAnalyzing || isSaving}
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/80"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                  )}

                  <Button
                    onClick={() => handleRemoveDraft(draft.id)}
                    disabled={isAnalyzing || isSaving}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border-2 border-purple-400/20">
              <Upload className="h-10 w-10 text-purple-400/60" />
            </div>
            <h3 className="text-xl font-headline italic text-white mb-2">No Images Uploaded</h3>
            <p className="text-sm text-white/40 mb-4 max-w-md">
              Upload product images to get started with AI-powered analysis and automatic product generation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
