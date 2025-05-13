import React from 'react';

const NotificationsTab = ({ notifications = [] }) => {
  const hasNotifications = notifications.length > 0;

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body">
          {/* header section with title and counter */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <h2 className="mb-0 me-2">Notifications</h2>
              {hasNotifications && (
                <span className="badge bg-primary">{notifications.length}</span>
              )}
            </div>
            {/* creating button to mark messages as read */}
            {hasNotifications && (
              <button className="btn btn-link text-secondary">Mark all as read</button>
            )}
          </div>

          {hasNotifications ? (
            <div className="list-group">
              {notifications.map((notification, index) => (
                <div key={index} className="list-group-item list-group-item-action">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0 me-3">
                      <img
                        src={notification.avatarUrl || "/api/placeholder/40/40"}
                        alt={notification.userName}
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      {/* Main notification info */}
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-1">{notification.userName}</span>
                        <span className="text-muted me-1">{notification.action}</span>
                        {notification.target && (
                          <span className="text-muted me-1">{notification.target}</span>
                        )}
                        {notification.highlightDot && (
                          <span
                            className="bg-danger rounded-circle"
                            style={{ width: '8px', height: '8px' }}
                          ></span>
                        )}
                      </div>
                      <p className="text-muted small mt-1">{notification.time}</p>
                      {notification.message && (
                        <div className="mt-2 p-3 border rounded text-muted small">
                          {notification.message}
                        </div>
                      )}
                      {notification.thumbnail && (
                        <div className="mt-2">
                          <img
                            src={notification.thumbnail}
                            alt="Thumbnail"
                            className="rounded"
                            style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-bell fs-1 text-muted mb-3"></i>
              <h3 className="mb-2 text-dark">No notifications yet</h3>
              <p className="text-muted small">We'll notify you when something arrives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;