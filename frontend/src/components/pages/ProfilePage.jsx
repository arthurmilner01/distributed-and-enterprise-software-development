import { useAuth } from "../../context/AuthContext";
import { useState } from "react"; 
import { Edit } from "lucide-react";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState("posts");

  if (!isAuthenticated || !user) {
    return <p>Loading profile data...</p>;
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-3 text-center">
          <img
            src={user.profile_picture || default_profile_picture}
            alt="Profile"
            className="img-fluid rounded-circle border border-3 text-info"
            style={{ width: "200px", height: "200px" }}
          />
        </div>

        <div className="col-md-9">
          <div className="d-flex flex-column justify-content-center">
            <h2 className="mt-4">
              {user.first_name || "Unknown"} {user.last_name || "Unknown"}
                <button
                    className="btn text-info p-0 ms-2"
                    onClick={() => console.log("Edit last name clicked")}  // Add functionality for editing last name
                >
                    <Edit size={25} />
                </button>
            </h2>
            <p className="text-muted">{user.email || "Unknown"}</p>
            <hr />
            <div className="mb-3">
              <h4>Bio</h4>
              <p>{user.bio || "User has not provided a bio..."}</p>
            </div>
            <div className="mb-3">
              <h4>Interests</h4>
              <p>{user.interests || "User has not provided any interests..."}</p>
            </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-pills mb-3 d-flex justify-content-center" id="profile-tabs" role="tab-list">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("posts")}
          >
            Posts
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "communities" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("communities")}
          >
            Communities
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "events" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("events")}
          >
            Events
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {currentTab === "posts" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">User Posts</h5>
                <p className="card-text">User posts here...</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === "communities" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">User Communities</h5>
                <p className="card-text">User's communities here...</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === "events" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Upcoming Events</h5>
                <p className="card-text">Upcoming events here...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
