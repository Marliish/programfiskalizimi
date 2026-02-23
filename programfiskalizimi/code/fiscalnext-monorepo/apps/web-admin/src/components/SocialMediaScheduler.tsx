// Social Media Scheduler - PRODUCTION READY
// Created: 2026-02-23 by Boli + Mela (CEO ORDER)
// Complete social media management with scheduling

import React, { useState, useEffect } from 'react';

interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter';
  content: string;
  mediaUrls: string[];
  status: string;
  likes: number;
  shares: number;
  comments: number;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
}

interface SocialReview {
  id: string;
  platform: string;
  reviewerName?: string;
  rating: number;
  reviewText?: string;
  responded: boolean;
  responseText?: string;
  createdAt: string;
}

interface SocialOverview {
  totalPosts: number;
  scheduledPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

export const SocialMediaScheduler: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [reviews, setReviews] = useState<SocialReview[]>([]);
  const [overview, setOverview] = useState<SocialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, reviewsRes, overviewRes] = await Promise.all([
        fetch('/api/social/posts'),
        fetch('/api/social/reviews'),
        fetch('/api/social/overview'),
      ]);

      const postsData = await postsRes.json();
      const reviewsData = await reviewsRes.json();
      const overviewData = await overviewRes.json();

      setPosts(postsData.posts || []);
      setReviews(reviewsData.reviews || []);
      setOverview(overviewData);
    } catch (error) {
      console.error('Failed to fetch social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const data = {
      platform: formData.get('platform'),
      content: formData.get('content'),
      mediaUrls: [],
    };

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('Post created!');
        setShowCreateModal(false);
        fetchData();
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Error creating post');
    }
  };

  const handlePublishPost = async (postId: string) => {
    if (!confirm('Publish this post now?')) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Post published!');
        fetchData();
      } else {
        alert('Failed to publish post');
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      alert('Error publishing post');
    }
  };

  const handleSchedulePost = async (postId: string) => {
    const dateStr = prompt('Enter schedule date/time (YYYY-MM-DD HH:MM):');
    if (!dateStr) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor: new Date(dateStr).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Post scheduled!');
        fetchData();
      } else {
        alert('Failed to schedule post');
      }
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Error scheduling post');
    }
  };

  const handleRespondToReview = async (reviewId: string) => {
    const response = prompt('Enter your response:');
    if (!response) return;

    try {
      const res = await fetch(`/api/social/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: response }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Response submitted!');
        fetchData();
      } else {
        alert('Failed to submit response');
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('Error submitting response');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      default:
        return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      case 'twitter':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading social media...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📲 Social Media Manager</h1>
            <p className="text-gray-600 mt-1">
              Schedule posts and manage reviews across all platforms
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 font-semibold"
          >
            + Create Post
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Posts</div>
            <div className="text-3xl font-bold text-gray-900">{overview.totalPosts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Scheduled</div>
            <div className="text-3xl font-bold text-blue-600">{overview.scheduledPosts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Engagement</div>
            <div className="text-3xl font-bold text-purple-600">
              {overview.totalEngagement.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Avg Engagement Rate</div>
            <div className="text-3xl font-bold text-green-600">
              {overview.avgEngagementRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'posts'
                ? 'border-b-2 border-pink-600 text-pink-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'reviews'
                ? 'border-b-2 border-pink-600 text-pink-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⭐ Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 gap-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-gray-500">No posts yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-pink-600 hover:text-pink-700 font-semibold"
              >
                Create your first post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getPlatformIcon(post.platform)}</div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPlatformColor(
                          post.platform
                        )}`}
                      >
                        {post.platform}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {post.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handlePublishPost(post.id)}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleSchedulePost(post.id)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Schedule
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {post.status === 'published' && (
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span className="font-semibold">{post.likes.toLocaleString()}</span>
                      <span>likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🔄</span>
                      <span className="font-semibold">{post.shares.toLocaleString()}</span>
                      <span>shares</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>💬</span>
                      <span className="font-semibold">{post.comments.toLocaleString()}</span>
                      <span>comments</span>
                    </div>
                  </div>
                )}

                {post.scheduledFor && (
                  <div className="mt-3 text-sm text-gray-600">
                    ⏰ Scheduled for: {new Date(post.scheduledFor).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 gap-6">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {review.reviewerName || 'Anonymous'}
                      </span>
                      <div className="flex items-center">
                        {'⭐'.repeat(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          ({review.rating}/5)
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPlatformColor(review.platform)}`}>
                      {review.platform}
                    </span>
                  </div>

                  {!review.responded && (
                    <button
                      onClick={() => handleRespondToReview(review.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Respond
                    </button>
                  )}
                </div>

                {review.reviewText && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-gray-900">{review.reviewText}</p>
                  </div>
                )}

                {review.responded && review.responseText && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      Your Response:
                    </div>
                    <p className="text-blue-900">{review.responseText}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create Social Media Post</h2>

            <form onSubmit={handleCreatePost}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    name="platform"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select platform...</option>
                    <option value="facebook">📘 Facebook</option>
                    <option value="instagram">📷 Instagram</option>
                    <option value="twitter">🐦 Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post Content
                  </label>
                  <textarea
                    name="content"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="What's on your mind?"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use emojis to make your post more engaging! 🎉
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> After creating the post, you can either publish it
                    immediately or schedule it for later.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaScheduler;
