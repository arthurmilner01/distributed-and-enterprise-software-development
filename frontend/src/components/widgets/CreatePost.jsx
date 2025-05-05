import React from "react";


const CreatePost = ({
  newPost,
  setNewPost,
  newPostImage,
  setNewPostImage,
  newPostVideo,
  setNewPostVideo,
  handlePostSubmit,
  isMembersOnly = false,
  setIsMembersOnly = null
}) => {
    // If setIsMembersOnly is passed properly then display the privacy option
    const showMembersOnlyCheckbox = typeof setIsMembersOnly === "function";

    return (
        <div
        className="create-post mb-4"
        style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
        >
            <textarea
                className="form-control mb-2"
                style={{ minHeight: "100px", resize: "none" }}
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
            />
            {showMembersOnlyCheckbox && (
                <div className="form-check" style={{ marginBottom: "15px", textAlign: "left" }}>
                    <input
                    className="form-check-input"
                    type="checkbox"
                    id="membersOnlyCheck"
                    checked={isMembersOnly}
                    onChange={(e) => setIsMembersOnly(e.target.checked)}
                    />
                    <label className="form-check-label text-black" htmlFor="membersOnlyCheck">
                    Members-only post (visible only to community members)
                    </label>
                </div>
            )}

        <div className="d-flex align-items-center gap-2 mb-2">
            {/* Photo Upload */}
            <label htmlFor="photoInput" className="btn btn-light border" style={{ fontWeight: 500 }}>
            📷 Photo
            </label>
            <input
            type="file"
            id="photoInput"
            accept="image/*"
            onChange={(e) => setNewPostImage(e.target.files[0])}
            style={{ display: "none" }}
            />

            {/* Video Upload */}
            <label htmlFor="videoInput" className="btn btn-light border" style={{ fontWeight: 500 }}>
            🎥 Video
            </label>
            <input
            type="file"
            id="videoInput"
            accept="video/*"
            onChange={(e) => setNewPostVideo(e.target.files[0])}
            style={{ display: "none" }}
            />
        </div>

        {newPostImage && (
            <div className="mb-2">
            <img
                src={URL.createObjectURL(newPostImage)}
                alt="Selected"
                style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                borderRadius: "8px",
                }}
            />
            </div>
        )}

        <button className="btn btn-primary" onClick={handlePostSubmit}>
            Post
        </button>
        </div>
    );
};

export default CreatePost;
