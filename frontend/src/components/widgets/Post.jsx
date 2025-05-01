import React from "react";
import { useState } from "react";
import { Trash, ThumbsUp, Pin } from "lucide-react";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import PostPinButton from "../ui/PinPostButton";


const Post = ({
  post,
  user,
  renderPostText,
  handleLikeToggle,
  handleDeletePost,
  handleCommentSubmit,
  newComment,
  setNewComment,
  isLeader= false, // Default values as only used on community page
  isPostPinned = () => {},
  fetchPinnedPosts = () => {},
  fetchCommunityPosts = () => {},
  communityId = 0
}) => {
  const navigate = useNavigate();
  const [showAllComments, setShowAllComments] = useState(false);

  return (
    <div
      className="post mb-4"
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {/* User Info */}
      <div className="d-flex align-items-center mb-3">
        <img
          src={post.user_image || default_profile_picture}
          alt="User Avatar"
          style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
        />
        <div>
          <div style={{ fontWeight: "bold" }}>
            <span
              className="text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/profile/${post.user}`)}
            >
              {post.user_name} {post.user_last_name}
              {isPostPinned(post.id) && (
                <span className="badge bg-warning ms-2">
                  <Pin size={12} className="me-1" />
                  Pinned
                </span>
              )}
            </span>
            {isLeader && (
              <PostPinButton
                post={post}
                communityId={communityId}
                isPinned={isPostPinned(post.id)}
                onPinStatusChange={() => {
                  fetchPinnedPosts();
                  fetchCommunityPosts();
                }}
              />
            )}
          </div>
          <div style={{ color: "#777", fontSize: "12px" }}>
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Post Text */}
      <p>{renderPostText(post.post_text)}</p>

      {/* Post Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          style={{
            maxWidth: "100%",
            borderRadius: "8px",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        />
      )}

      {/* Like + Delete */}
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-sm me-2"
          style={{
            backgroundColor: post.liked_by_user ? "#e0f7fa" : "#f1f1f1",
            color: post.liked_by_user ? "#007BFF" : "#555",
            border: "none",
            borderRadius: "20px",
            fontWeight: 500,
          }}
          onClick={() => handleLikeToggle(post.id)}
        >
          <ThumbsUp size={20} /> {post.liked_by_user ? "Liked" : "Like"}
        </button>
        <span style={{ color: "#555", fontSize: "14px" }}>
          {post.like_count} {post.like_count === 1 ? "Like" : "Likes"}
        </span>
        {post.user === user.id && (
          <div>
            <button
              className="btn btn-danger ms-5"
              style={{ borderRadius: "25px", border: "none" }}
              onClick={() => handleDeletePost(post.id)}
            >
              <Trash size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Community Link */}
      {post.community_name?.trim() !== "Global Community (News Feed)" && (
        <span
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/communities/${post.community}`)}
        >
          <p className="text-muted fst-italic">
            Posted in {post.community_name} Community
          </p>
        </span>
      )}

      {/* Comments */}
      <div className="comment-section">
        <h6>Comments</h6>
        {post.comments?.length > 0 ? (
          <ul className="list-unstyled">
            {post.comments.slice(0, 5).map((comment) => (
              <li
                key={comment.id}
                className="d-flex align-items-start mb-2"
                style={{ background: "#f0f2f5", padding: "8px", borderRadius: "12px" }}
              >
                <img
                  src={comment.user_image || default_profile_picture}
                  alt="User Avatar"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    marginRight: "10px",
                    marginTop: "3px",
                  }}
                />
                <div>
                  <span
                    className="text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${comment.user}`)}
                  >
                    <strong>
                      {comment.user_name} {comment.user_last_name}
                    </strong>
                  </span>
                  : {comment.comment_text}
                  <br />
                  <small style={{ color: "#777" }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </small>
                </div>
              </li>
            ))}
            {post.comments.length > 5 && (
              <div className="text-center mt-2">
                <Button variant="outline-primary" size="sm" onClick={() => setShowAllComments(true)}>
                  View all comments
                </Button>
              </div>
            )}
          </ul>
        ) : (
          <p className="text-muted">No comments yet.</p>
        )}
      </div>

      {/* Add Comment */}
      <form
        onSubmit={(e) => handleCommentSubmit(e, post.id)}
        className="d-flex mt-2"
      >
        <input
          type="text"
          className="form-control"
          placeholder="Write a comment..."
          value={newComment[post.id] || ""}
          onChange={(e) =>
            setNewComment({ ...newComment, [post.id]: e.target.value })
          }
          required
        />
        <button
          type="submit"
          className="btn btn-primary ms-2"
          style={{ borderRadius: "20px" }}
        >
          Submit
        </button>
      </form>
      {/* Modal which displays all the comments on a post */}
      <Modal show={showAllComments} onHide={() => setShowAllComments(false)} scrollable>
        <Modal.Header closeButton>
          <Modal.Title>All Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {post.comments.map((comment) => (
            <div
              key={comment.id}
              className="d-flex align-items-start mb-3"
              style={{ background: "#f0f2f5", padding: "8px", borderRadius: "12px" }}
            >
              <img
                src={comment.user_image || default_profile_picture}
                alt="User Avatar"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  marginRight: "10px",
                  marginTop: "3px",
                }}
              />
              <div>
                <span
                  className="text-primary"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${comment.user}`)}
                >
                  <strong>{comment.user_name} {comment.user_last_name}</strong>
                </span>
                : {comment.comment_text}
                <br />
                <small style={{ color: "#777" }}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </Modal.Body>
      </Modal>

    </div>

  );
};

export default Post;
