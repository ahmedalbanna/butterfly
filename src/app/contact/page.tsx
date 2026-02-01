'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createCustomerMessage } from '@/app/actions/messages';
import { Mail, Phone, MapPin, Send, CheckCircle, Headphones } from 'lucide-react';
import { TestCallButton } from '@/components/test-call-button';

export default function ContactPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    subject: orderId ? `Inquiry about Order #${orderId.slice(-8).toUpperCase()}` : '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createCustomerMessage({
      ...formData,
      orderId: orderId || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        subject: '',
        message: '',
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } else {
      setError(result.error || 'Failed to send message');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-neutral-900/50 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif text-primary">Message Sent</CardTitle>
            <CardDescription className="text-neutral-300">
              Thank you for reaching out to LuxeFinds
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-neutral-400">
            <p className="mb-4">
              Your message has been received. Our team will review your inquiry and respond within 24 hours.
            </p>
            <p className="text-sm">
              Redirecting to homepage...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-neutral-300 text-lg max-w-2xl mx-auto">
            We're here to assist you with any inquiries about our exquisite collection
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Contact Information */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-neutral-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-primary">Get in Touch</CardTitle>
                <CardDescription className="text-neutral-400">
                  Reach out to our dedicated team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-neutral-200">Email</p>
                    <p className="text-sm text-neutral-400">support@luxefinds.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-neutral-200">Phone</p>
                    <p className="text-sm text-neutral-400">+1 (555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-neutral-200">Boutique Address</p>
                    <p className="text-sm text-neutral-400">
                      123 Luxury Lane<br />
                      Beverly Hills, CA 90210<br />
                      United States
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-primary">Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Monday - Friday</span>
                  <span className="text-neutral-200">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Saturday</span>
                  <span className="text-neutral-200">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Sunday</span>
                  <span className="text-neutral-200">Closed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Live Support
                </CardTitle>
                <CardDescription className="text-neutral-300">
                  Speak with our team instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-300">
                  Experience personalized assistance with a direct voice call to our luxury stylists.
                </p>
                <TestCallButton />
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <Card className="bg-neutral-900/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-primary">Send Us a Message</CardTitle>
                <CardDescription className="text-neutral-400">
                  {orderId 
                    ? `Inquiring about Order #${orderId.slice(-8).toUpperCase()}`
                    : 'Fill out the form below and we\'ll get back to you shortly'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-neutral-200">
                        Full Name *
                      </Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        required
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                        placeholder="John Smith"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-neutral-200">
                        Email Address *
                      </Label>
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={handleChange}
                        required
                        className="bg-neutral-800 border-neutral-700 text-neutral-100"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-neutral-200">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-neutral-200">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="bg-neutral-800 border-neutral-700 text-neutral-100"
                      placeholder="What can we help you with?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-neutral-200">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="bg-neutral-800 border-neutral-700 text-neutral-100 resize-none"
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    size="lg"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
