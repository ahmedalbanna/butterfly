'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createCustomOrder } from '@/app/actions/custom-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, ImageIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      toast({
        title: 'Too many images',
        description: 'Maximum 5 images allowed',
        variant: 'destructive',
      });
      return;
    }

    // Create previews
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'No images',
        description: 'Please upload at least one reference image',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName);
      formData.append('customerEmail', customerEmail);
      if (customerPhone) formData.append('customerPhone', customerPhone);
      formData.append('description', description);
      if (user?.uid) formData.append('customerId', user.uid);

      images.forEach((image) => {
        formData.append('images', image);
      });

      const result = await createCustomOrder(formData);

      if (result.success) {
        toast({
          title: 'Request submitted',
          description: 'Your custom order request has been submitted successfully',
        });
        router.push(`/custom-order/${result.customOrderId}`);
      } else {
        toast({
          title: 'Submission failed',
          description: result.error || 'Failed to submit custom order',
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h1 className="text-5xl font-serif text-yellow-500">Custom Creations</h1>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Share your vision with us. Upload inspiration photos and describe your dream accessory. 
            Our artisans will craft a bespoke piece exclusively for you.
          </p>
        </div>

        <Card className="bg-black border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-yellow-500 font-serif">Your Vision</CardTitle>
            <CardDescription className="text-white/70">
              Tell us about the custom accessory you'd like us to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-white">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-black border-white/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail" className="text-white">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-black border-white/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-white">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-black border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-white">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your vision... What style, materials, colors, or features would you like? Any specific details we should know?"
                  className="bg-black border-white/20 text-white min-h-[150px]"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-white mb-2 block">
                  Reference Images <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-white/60 mb-4">
                  Upload up to 5 images showing similar styles or inspiration (JPG, PNG)
                </p>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/20">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {images.length < 5 && (
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-yellow-500/50 transition">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                      <p className="text-white/70">Click to upload images</p>
                      <p className="text-sm text-white/50 mt-2">
                        {images.length} / 5 images uploaded
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-serif text-lg h-12"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Submit Custom Order Request
                  </>
                )}
              </Button>

              <p className="text-sm text-white/60 text-center">
                We'll review your request and provide a quote within 24-48 hours
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
