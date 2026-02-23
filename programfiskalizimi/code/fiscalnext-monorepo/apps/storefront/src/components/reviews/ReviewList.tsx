'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  media?: Array<{ url: string; type: string }>;
  response?: {
    response: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ReviewListProps {
  productId: string;
  customerId?: string;
}

export function ReviewList({ productId, customerId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'helpful'>('createdAt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews?productId=${productId}&sortBy=${sortBy}&status=approved`
      );
      const data = await response.json();
      setReviews(data.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (!customerId) return;

    try {
      await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, isHelpful }),
      });
      fetchReviews();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Customer Reviews ({reviews.length})</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="createdAt">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>

                {review.title && (
                  <h4 className="font-semibold mb-1">{review.title}</h4>
                )}

                <p className="text-gray-700 mb-2">{review.comment}</p>

                {review.media && review.media.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.media.map((media, idx) => (
                      <img
                        key={idx}
                        src={media.url}
                        alt="Review"
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    {review.customer.firstName} {review.customer.lastName}
                  </span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {customerId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(review.id, true)}
                        className="hover:text-green-600"
                      >
                        👍 Helpful ({review.helpfulCount})
                      </button>
                    </div>
                  )}
                </div>

                {review.response && (
                  <div className="mt-3 ml-6 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold mb-1">
                      Response from {review.response.user.firstName}:
                    </p>
                    <p className="text-sm text-gray-700">
                      {review.response.response}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
