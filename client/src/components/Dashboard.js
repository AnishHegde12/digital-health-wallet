import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import UploadReport from './UploadReport';
import VitalsChart from './VitalsChart';
import ShareAccess from './ShareAccess';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [sharedReports, setSharedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [filters, setFilters] = useState({
    date: '',
    reportType: '',
    vitalType: '',
  });
  const [showUpload, setShowUpload] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const response = await reportsAPI.getAll(filters);
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSharedReports = useCallback(async () => {
    try {
      const response = await reportsAPI.getShared();
      setSharedReports(response.data);
    } catch (err) {
      console.error('Error fetching shared reports:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReports();
    fetchSharedReports();
  }, [user, navigate, filters, fetchReports, fetchSharedReports]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportsAPI.delete(id);
        fetchReports();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete report');
      }
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await reportsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download report');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const clearFilters = () => {
    setFilters({ date: '', reportType: '', vitalType: '' });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Digital Health Wallet</h1>
          <div className="header-actions">
            <span className="user-info">Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="tabs">
          <button
            className={activeTab === 'reports' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('reports')}
          >
            My Reports
          </button>
          <button
            className={activeTab === 'vitals' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('vitals')}
          >
            Vitals Trends
          </button>
          <button
            className={activeTab === 'shared' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('shared')}
          >
            Shared With Me
          </button>
        </div>

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>My Health Reports</h2>
              <button onClick={() => setShowUpload(!showUpload)} className="btn-primary">
                {showUpload ? 'Cancel Upload' : 'Upload Report'}
              </button>
            </div>

            {showUpload && (
              <div className="upload-section">
                <UploadReport onUpload={() => { setShowUpload(false); fetchReports(); }} />
              </div>
            )}

            <div className="filters">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                placeholder="Filter by date"
                className="filter-input"
              />
              <select
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                className="filter-input"
              >
                <option value="">All Report Types</option>
                <option value="Blood Test">Blood Test</option>
                <option value="X-Ray">X-Ray</option>
                <option value="MRI">MRI</option>
                <option value="CT Scan">CT Scan</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="ECG">ECG</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={filters.vitalType}
                onChange={(e) => setFilters({ ...filters, vitalType: e.target.value })}
                className="filter-input"
              >
                <option value="">All Vital Types</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="blood_sugar">Blood Sugar</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="cholesterol">Cholesterol</option>
              </select>
              {(filters.date || filters.reportType || filters.vitalType) && (
                <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
              )}
            </div>

            {loading ? (
              <div className="loading">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="empty-state">No reports found. Upload your first report!</div>
            ) : (
              <div className="reports-grid">
                {reports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <h3>{report.report_type}</h3>
                      <span className="report-date">{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    <div className="report-info">
                      <p><strong>File:</strong> {report.original_filename}</p>
                      <p><strong>Type:</strong> {report.file_type.toUpperCase()}</p>
                      {report.share_count > 0 && (
                        <p><strong>Shared with:</strong> {report.share_count} user(s)</p>
                      )}
                    </div>
                    <div className="report-actions">
                      <button
                        onClick={() => handleDownload(report.id, report.original_filename)}
                        className="btn-action"
                      >
                        Download
                      </button>
                      <ShareAccess reportId={report.id} reportTitle={report.report_type} />
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="vitals-section">
            <h2>Vitals Trends</h2>
            <VitalsChart />
          </div>
        )}

        {activeTab === 'shared' && (
          <div className="shared-section">
            <h2>Reports Shared With Me</h2>
            {sharedReports.length === 0 ? (
              <div className="empty-state">No reports have been shared with you yet.</div>
            ) : (
              <div className="reports-grid">
                {sharedReports.map((report) => (
                  <div key={report.id} className="report-card shared">
                    <div className="report-header">
                      <h3>{report.report_type}</h3>
                      <span className="report-date">{new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    <div className="report-info">
                      <p><strong>File:</strong> {report.original_filename}</p>
                      <p><strong>Shared by:</strong> {report.owner_username || 'Unknown'}</p>
                      <p><strong>Access:</strong> {report.role}</p>
                    </div>
                    <div className="report-actions">
                      <button
                        onClick={() => handleDownload(report.id, report.original_filename)}
                        className="btn-action"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

