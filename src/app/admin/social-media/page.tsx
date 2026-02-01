'use client';

import { useEffect, useState } from 'react';
import { getSocialMediaPosts, getSocialMediaStats, retrySocialMediaPost } from '@/app/actions/admin-products';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, RefreshCw, ExternalLink, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialMediaPost } from '@prisma/client';
import Image from 'next/image';

type SocialMediaPostWithProduct = SocialMediaPost & {
  product: { name: string; image: string };
};

export default function SocialMediaPage() {
  const [posts, setPosts] = useState<SocialMediaPostWithProduct[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    pendingPosts: 0,
    failedPosts: 0,
    byPlatform: {} as Record<string, number>,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [retryingPostId, setRetryingPostId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [postsData, statsData] = await Promise.all([
      getSocialMediaPosts(),
      getSocialMediaStats(),
    ]);
    setPosts(postsData);
    setStats(statsData);
    setIsLoading(false);
  };

  const handleRetry = async (postId: string) => {
    setRetryingPostId(postId);
    const result = await retrySocialMediaPost(postId);
    setRetryingPostId(null);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Post retry initiated',
      });
      loadData();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to retry post',
        variant: 'destructive',
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      pinterest: '📌',
      tiktok: '🎵',
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Published
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-headline italic text-white mb-2">Social Media</h1>
        <p className="text-sm text-white/60 uppercase tracking-wider">
          Manage social media posts and analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60 font-bold mb-1">
                Total Posts
              </p>
              <p className="text-3xl font-headline text-white">{stats.totalPosts}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="bg-black/40 border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60 font-bold mb-1">
                Published
              </p>
              <p className="text-3xl font-headline text-green-400">{stats.publishedPosts}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-black/40 border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60 font-bold mb-1">
                Pending
              </p>
              <p className="text-3xl font-headline text-yellow-400">{stats.pendingPosts}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-black/40 border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60 font-bold mb-1">
                Failed
              </p>
              <p className="text-3xl font-headline text-red-400">{stats.failedPosts}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(stats.byPlatform).length > 0 && (
        <Card className="bg-black/40 border-white/10 p-6">
          <h2 className="text-xl font-headline italic text-primary mb-4">Posts by Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.byPlatform).map(([platform, count]) => (
              <div key={platform} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-2xl">{getPlatformIcon(platform)}</span>
                <div>
                  <p className="text-xs text-white/60 capitalize">{platform}</p>
                  <p className="text-lg font-bold text-white">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Posts Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-black/40 border-white/10 p-12 text-center">
          <p className="text-white/60">No social media posts yet</p>
          <p className="text-sm text-white/40 mt-2">
            Go to Products and click the Share button to publish
          </p>
        </Card>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">
                    Platform
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-white/60 font-bold">
                    Published
                  </th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-white/60 font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded overflow-hidden relative shrink-0">
                          {post.product.image && (
                            <Image
                              src={post.product.image}
                              alt={post.product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <p className="font-headline text-white">{post.product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                        <span className="text-white/60 capitalize">{post.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                    <td className="px-6 py-4 text-white/60">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        {post.postUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(post.postUrl!, '_blank')}
                            className="h-8 text-white/60 hover:text-primary hover:bg-primary/10"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        {post.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetry(post.id)}
                            disabled={retryingPostId === post.id}
                            className="h-8 text-white/60 hover:text-yellow-400 hover:bg-yellow-400/10"
                          >
                            <RefreshCw
                              className={`w-4 h-4 mr-1 ${
                                retryingPostId === post.id ? 'animate-spin' : ''
                              }`}
                            />
                            Retry
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
