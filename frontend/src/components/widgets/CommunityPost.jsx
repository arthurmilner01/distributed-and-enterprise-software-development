import React from "react";
import { ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const CommunityPost = ({
  communityPost,
  user,
  handleLikeToggle,
  handleCommentSubmit,
  newComment,
  setNewComment,
  renderPostText,
}) => {
  const navigate = useNavigate();

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
      {/* Community Info */}
      <div className="d-flex align-items-center mb-3">
        <div>
          <div style={{ fontWeight: "bold" }}>
            <span
              className="text-primary"
              style={{ cursor: "pointer", fontSize: "1.4em" }}
              onClick={() => navigate(`/communities/${communityPost.community}`)}
            >
              {communityPost.community_name}
            </span>
            <p className="text-muted fst-italic">
              by{" "}
              <span
                className="text-muted fst-italic cursor-pointer text-decoration-underline"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/profile/${communityPost.user}`)}
              >
                {communityPost.user_name} {communityPost.user_last_name}
              </span>
            </p>
          </div>
          <div style={{ color: "#777", fontSize: "12px" }}>
            {new Date(communityPost.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Post Text */}
      <p>{renderPostText(communityPost.post_text)}</p>

      {/* Post Image */}
      {communityPost.image_url && (
        <img
          src={communityPost.image_url}
          alt="Post"
          style={{
            maxWidth: "100%",
            borderRadius: "8px",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        />
      )}

      {/* Like Button and Count */}
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-sm me-2"
          style={{
            backgroundColor: communityPost.liked_by_user ? "#e0f7fa" : "#f1f1f1",
            color: communityPost.liked_by_user ? "#007BFF" : "#555",
            border: "none",
            borderRadius: "20px",
            fontWeight: 500,
          }}
          onClick={() => handleLikeToggle(communityPost.id)}
        >
          <ThumbsUp size={20} /> {communityPost.liked_by_user ? "Liked" : "Like"}
        </button>
        <span style={{ color: "#555", fontSize: "14px" }}>
          {communityPost.like_count} {communityPost.like_count === 1 ? "Like" : "Likes"}
        </span>
      </div>

      {/* Comments Section */}
      <div className="comment-section">
        <h6>Comments</h6>
        {communityPost.comments?.length > 0 ? (
          <ul className="list-unstyled">
            {communityPost.comments.slice(0, 5).map((comment) => (
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
          </ul>
        ) : (
          <p className="text-muted">No comments yet.</p>
        )}
      </div>

      {/* Add Comment */}
      <form
        onSubmit={(e) => handleCommentSubmit(e, communityPost.id)}
        className="d-flex mt-2"
      >
        <input
          type="text"
          className="form-control"
          placeholder="Write a comment..."
          value={newComment[communityPost.id] || ""}
          onChange={(e) =>
            setNewComment({ ...newComment, [communityPost.id]: e.target.value })
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
    </div>
  );
};

export default CommunityPost;
