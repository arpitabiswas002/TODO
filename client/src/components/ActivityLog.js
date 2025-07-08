import React, { useState, useEffect } from 'react';
import './ActivityLog.css';
import io from 'socket.io-client';
import { activityAPI } from '../services/api';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
};

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await activityAPI.getActivities();
        setActivities(response.data.data);
      } catch (err) {
        console.error('Failed to load activity log:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('new_activity', (newActivity) => {
      setActivities(prevActivities => [newActivity, ...prevActivities]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return <div className="activity-log-panel"><h2>Activity Log</h2><p>Loading...</p></div>;
  }

  return (
    <aside className="activity-log-panel">
      <h2>Activity Log</h2>
      <ul className="activity-list">
        {activities.map(activity => (
          <li key={activity.id} className="activity-item">
            <div className="activity-details">{activity.details}</div>
            <time className="activity-time">{formatTimeAgo(activity.createdAt)}</time>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default ActivityLog;
