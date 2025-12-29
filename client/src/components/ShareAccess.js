import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { sharesAPI } from '../services/api';
import './ShareAccess.css';

const ShareAccess = React.memo(({ reportId, reportTitle }) => {
  const [showModal, setShowModal] = useState(false);
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const modalContentRef = useRef(null);

  const handleShare = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sharedWithEmail) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      await sharesAPI.share(reportId, { sharedWithEmail, role });
      setSuccess(`Report shared successfully with ${sharedWithEmail}`);
      setSharedWithEmail('');
      fetchShares();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share report');
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    setLoadingShares(true);
    try {
      const response = await sharesAPI.getReportShares(reportId);
      setShares(response.data);
    } catch (err) {
      console.error('Error fetching shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (window.confirm('Are you sure you want to revoke access?')) {
      try {
        await sharesAPI.revoke(shareId);
        fetchShares();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to revoke access');
      }
    }
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setError('');
    setSuccess('');
    setSharedWithEmail('');
    setRole('viewer');
  }, []);

  const openModal = () => {
    setShowModal(true);
    setError('');
    setSuccess('');
    setSharedWithEmail('');
    setRole('viewer');
    fetchShares();
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && showModal) {
        closeModal();
      }
    };
    
    if (showModal) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, closeModal]);

  return (
    <>
      <button onClick={openModal} className="btn-share">
        Share
      </button>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div 
            ref={modalContentRef}
            className="modal-content"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h3>Share Report: {reportTitle}</h3>
              <button className="close-btn" onClick={closeModal} aria-label="Close modal">
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleShare} className="share-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="email">Share with (Email)</label>
                  <input
                    type="email"
                    id="email"
                    value={sharedWithEmail}
                    onChange={(e) => setSharedWithEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Access Level</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="editor">Editor (Read & Write)</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Sharing...' : 'Share Report'}
                </button>
              </form>

              <div className="shares-list">
                <h4>Currently Shared With</h4>
                {loadingShares ? (
                  <div className="loading">Loading shares...</div>
                ) : shares.length === 0 ? (
                  <div className="empty-state">No shares yet</div>
                ) : (
                  <ul>
                    {shares.map((share) => (
                      <li key={share.id} className="share-item">
                        <div className="share-info">
                          <strong>{share.username || share.shared_with_email}</strong>
                          <span className="share-role">{share.role}</span>
                        </div>
                        <button
                          onClick={() => handleRevoke(share.id)}
                          className="btn-revoke"
                        >
                          Revoke
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ShareAccess;

