import React, { useState } from "react";
import { Pin } from 'lucide-react';
import useApi from "../../api";

// Button component to pin or unpin a post
const PostPinButton = ({ post, communityId, isPinned, onPinStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const api = useApi();

  // Handle pinning the post
  const handlePinPost = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post('api/pinnedposts/pin_post/', {
        post_id: post.id,
        community_id: communityId
      });
      if (onPinStatusChange) onPinStatusChange();
    } catch (error) {
      // Check if the error is about the 3 pinned posts limit
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError("Failed to pin post");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle unpinning the post
  const handleUnpinPost = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete('api/pinnedposts/unpin_post/', {
        params: { post_id: post.id }
      });
      if (onPinStatusChange) onPinStatusChange();
    } catch (error) {
      setError("Failed to unpin post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isPinned ? (
        <button 
          className="btn btn-sm btn-warning ms-2"
          onClick={handleUnpinPost}
          disabled={loading}
          title="Unpin Post"
        >
          <Pin size={16} />
        </button>
      ) : (
        <button 
          className="btn btn-sm btn-outline-warning ms-2"
          onClick={handlePinPost}
          disabled={loading}
          title="Pin Post"
        >
          <Pin size={16} />
        </button>
      )}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </>
  );
};

export default PostPinButton;
