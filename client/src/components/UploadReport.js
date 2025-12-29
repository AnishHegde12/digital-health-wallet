import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import './UploadReport.css';

const UploadReport = ({ onUpload }) => {
  const [formData, setFormData] = useState({
    report: null,
    reportType: '',
    date: new Date().toISOString().split('T')[0],
    vitals: {
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      bloodSugarFasting: '',
      bloodSugarPostprandial: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      cholesterol: '',
    },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or image file (JPEG, PNG, GIF)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFormData({ ...formData, report: file });
      setError('');
    }
  };

  const handleVitalChange = (field, value) => {
    setFormData({
      ...formData,
      vitals: {
        ...formData.vitals,
        [field]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.report) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.reportType) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('report', formData.report);
      uploadData.append('reportType', formData.reportType);
      uploadData.append('date', formData.date);

      const hasVitals = Object.values(formData.vitals).some(val => val !== '');
      if (hasVitals) {
        uploadData.append('vitals', JSON.stringify(formData.vitals));
      }

      await reportsAPI.upload(uploadData);
      
      setFormData({
        report: null,
        reportType: '',
        date: new Date().toISOString().split('T')[0],
        vitals: {
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          bloodSugarFasting: '',
          bloodSugarPostprandial: '',
          heartRate: '',
          temperature: '',
          weight: '',
          height: '',
          cholesterol: '',
        },
      });
      
      if (onUpload) {
        onUpload();
      }
      
      alert('Report uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-report">
      <h3>Upload Health Report</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="report">Select Report File (PDF or Image)</label>
          <input
            type="file"
            id="report"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            required
          />
          {formData.report && (
            <p className="file-name">Selected: {formData.report.name}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reportType">Report Type</label>
          <select
            id="reportType"
            value={formData.reportType}
            onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
            required
          >
            <option value="">Select report type</option>
            <option value="Blood Test">Blood Test</option>
            <option value="X-Ray">X-Ray</option>
            <option value="MRI">MRI</option>
            <option value="CT Scan">CT Scan</option>
            <option value="Ultrasound">Ultrasound</option>
            <option value="ECG">ECG</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Report Date</label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="vitals-section">
          <h4>Vitals (Optional)</h4>
          <div className="vitals-grid">
            <div className="form-group">
              <label htmlFor="bpSystolic">Blood Pressure (Systolic)</label>
              <input
                type="number"
                id="bpSystolic"
                value={formData.vitals.bloodPressureSystolic}
                onChange={(e) => handleVitalChange('bloodPressureSystolic', e.target.value)}
                placeholder="e.g., 120"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bpDiastolic">Blood Pressure (Diastolic)</label>
              <input
                type="number"
                id="bpDiastolic"
                value={formData.vitals.bloodPressureDiastolic}
                onChange={(e) => handleVitalChange('bloodPressureDiastolic', e.target.value)}
                placeholder="e.g., 80"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bsFasting">Blood Sugar (Fasting)</label>
              <input
                type="number"
                step="0.1"
                id="bsFasting"
                value={formData.vitals.bloodSugarFasting}
                onChange={(e) => handleVitalChange('bloodSugarFasting', e.target.value)}
                placeholder="e.g., 95"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bsPostprandial">Blood Sugar (Postprandial)</label>
              <input
                type="number"
                step="0.1"
                id="bsPostprandial"
                value={formData.vitals.bloodSugarPostprandial}
                onChange={(e) => handleVitalChange('bloodSugarPostprandial', e.target.value)}
                placeholder="e.g., 140"
              />
            </div>
            <div className="form-group">
              <label htmlFor="heartRate">Heart Rate (bpm)</label>
              <input
                type="number"
                id="heartRate"
                value={formData.vitals.heartRate}
                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                placeholder="e.g., 72"
              />
            </div>
            <div className="form-group">
              <label htmlFor="temperature">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                id="temperature"
                value={formData.vitals.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                placeholder="e.g., 98.6"
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                id="weight"
                value={formData.vitals.weight}
                onChange={(e) => handleVitalChange('weight', e.target.value)}
                placeholder="e.g., 70"
              />
            </div>
            <div className="form-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                id="height"
                value={formData.vitals.height}
                onChange={(e) => handleVitalChange('height', e.target.value)}
                placeholder="e.g., 170"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cholesterol">Cholesterol (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                id="cholesterol"
                value={formData.vitals.cholesterol}
                onChange={(e) => handleVitalChange('cholesterol', e.target.value)}
                placeholder="e.g., 200"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Uploading...' : 'Upload Report'}
        </button>
      </form>
    </div>
  );
};

export default UploadReport;

