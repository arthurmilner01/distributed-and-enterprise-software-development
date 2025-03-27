import {useState, useMemo} from "react";
import { Pin, Trash, ArrowUp, ArrowDown } from 'lucide-react';
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";

const PinnedPostsComponent = ({ pinnedPosts, isLeader, onUnpin, onReorder, communityId  }) => {
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(''); 

  // Unpin a post (for leaders only)
  const handleUnpinPost = async (postId) => {
    setIsLoading(true);
    setError('');
    try {
      await api.delete(`api/pinnedposts/unpin_post/`, {
        params: { post_id: postId }
      });
      // Call the callback to refresh the posts in the parent component
      if (onUnpin) onUnpin();
    } catch (error) {
      setError(err.response?.data?.error || "Failed to unpin post.");
    } finally {
      setIsLoading(false);
    }
  };

   // Ensure posts are sorted by the 'order' field before rendering
   // memoize  sorted list to avoid potentially unnecessary sorting on every render, ensuring we only re-sort when the actual pinned posts data changes.
  const sortedPinnedPosts = useMemo(() => {
    if (!pinnedPosts) return [];
    // Create a copy before sorting to avoid mutating props
    return [...pinnedPosts].sort((a, b) => a.order - b.order);
  }, [pinnedPosts]);

  const handleMove = async (index, direction) => {
    if (isLoading) return; // Prevent multiple rapid clicks

    const currentPosts = sortedPinnedPosts; // Use the already sorted list
    if (!currentPosts || currentPosts.length < 2) return; // Cannot reorder less than 2 items

    let newIndex = index + direction;

    // Bounds check
    if (newIndex < 0 || newIndex >= currentPosts.length) return;

    // Create the new ordered list of PinnedPost IDs
    const reorderedList = [...currentPosts]; // Clone
    const itemToMove = reorderedList.splice(index, 1)[0]; // Remove item
    reorderedList.splice(newIndex, 0, itemToMove); // Insert at new position

    // Get just the IDs in the new order
    const orderedPinnedPostIds = reorderedList.map(p => p.id); // Use PinnedPost ID (p.id)

    setIsLoading(true);
    setError('');
    try {
      // Call the new backend endpoint
      await api.post('api/pinnedposts/reorder/', {
        community_id: communityId, // Pass communityId
        ordered_pinned_post_ids: orderedPinnedPostIds
      });
      // Call the callback to refresh posts in the parent component
      if (onReorder) onReorder();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reorder posts.");
      console.error("Reorder error:", err);
      // Optionally, you might want to revert the visual state here if the API fails,
      // but simply refreshing (via onReorder) is often sufficient.
    } finally {
      setIsLoading(false);
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
          {/* Use the sorted list */}
          {sortedPinnedPosts.map((pinnedPost, index) => (
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
              {/* Post Content */}
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

              {/* Action Buttons (Leader Only) */}
              {isLeader && (
                <div className="d-flex flex-column flex-sm-row align-items-end ms-2"> {/* Button container */}
                   {/* Reorder Buttons */}
                   <div className="btn-group btn-group-sm me-sm-2 mb-1 mb-sm-0" role="group">
                        <button
                            className="btn btn-outline-secondary p-1"
                            onClick={() => handleMove(index, -1)} // Move Up
                            disabled={index === 0 || isLoading} // Disable if first or loading
                            title="Move Up"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button
                            className="btn btn-outline-secondary p-1"
                            onClick={() => handleMove(index, 1)} // Move Down
                            disabled={index === sortedPinnedPosts.length - 1 || isLoading} // Disable if last or loading
                            title="Move Down"
                        >
                            <ArrowDown size={14} />
                        </button>
                   </div>

                   {/* Unpin Button */}
                   <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleUnpinPost(pinnedPost.post_id)}
                      disabled={isLoading} // Disable while any action is loading
                      title="Unpin Post"
                   >
                      <Trash size={16} />
                   </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PinnedPostsComponent;