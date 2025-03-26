import React from "react";
import { Pin, Trash } from 'lucide-react';
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";

const PinnedPostsComponent = ({ pinnedPosts, isLeader, onUnpin }) => {
  const api = useApi();

  // Unpin a post (for leaders only)
  const handleUnpinPost = async (postId) => {
    try {
      await api.delete(`api/pinnedposts/unpin_post/`, {
        params: { post_id: postId }
      });
      // Call the callback to refresh the posts in the parent component
      if (onUnpin) onUnpin();
    } catch (error) {
    }
  };

  // Don't render anything if no pinned posts
  if (!pinnedPosts || pinnedPosts.length === 0) return null;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-warning text-white d-flex align-items-center">
        <Pin className="me-2" size={18} />
        <h4 className="mb-0">Pinned Posts</h4>
      </div>
      <div className="card-body">
        <ul className="list-group">
          {pinnedPosts.map((pinnedPost) => (
            <li 
              key={pinnedPost.id} 
              className="list-group-item d-flex align-items-start"
              style={{ borderLeft: '4px solid #FFC107' }}
            >
              <img
                src={pinnedPost.user_image || default_profile_picture}
                alt="User Avatar"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: "15px",
                  border: "2px solid #ddd",
                }}
              />
              <div style={{ flex: 1 }}>
                <div className="d-flex align-items-center">
                  <h5>
                    {pinnedPost.user_name} {pinnedPost.user_last_name}
                  </h5>
                  <span className="badge bg-warning ms-2">
                    <Pin size={12} className="me-1" />
                    Pinned
                  </span>
                </div>
                <p>{pinnedPost.post_text}</p>
                <small>{new Date(pinnedPost.post_created_at).toLocaleDateString()}</small>
              </div>
              {isLeader && (
                <button 
                  className="btn btn-sm btn-outline-danger" 
                  onClick={() => handleUnpinPost(pinnedPost.post_id)}
                  title="Unpin Post"
                >
                  <Trash size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PinnedPostsComponent;