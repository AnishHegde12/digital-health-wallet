import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { vitalsAPI } from '../services/api';
import './VitalsChart.css';

const VitalsChart = () => {
  const [vitalType, setVitalType] = useState('blood_pressure');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    setLoading(true);
    try {
      const filters = {
        startDate: startDate,
        endDate: endDate,
        vitalType: vitalType
      };

      const response = await vitalsAPI.getTrends(filters);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching vitals trends:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, vitalType]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchTrends();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [startDate, endDate, fetchTrends]);

  const renderChart = () => {
    if (!startDate || !endDate) {
      return (
        <div className="empty-state">
          Please select both Start Date and End Date to view the vitals chart.
        </div>
      );
    }

    if (loading) {
      return <div className="loading">Loading chart data...</div>;
    }

    if (data.length === 0) {
      return <div className="empty-state">No vitals data available for the selected period.</div>;
    }

    switch (vitalType) {
      case 'blood_pressure':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="systolic" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Systolic (mmHg)" 
              />
              <Line 
                type="monotone" 
                dataKey="diastolic" 
                stroke="#36a2eb" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#36a2eb" }}
                activeDot={{ r: 7 }}
                name="Diastolic (mmHg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'blood_sugar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="fasting" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Fasting (mg/dL)" 
              />
              <Line 
                type="monotone" 
                dataKey="postprandial" 
                stroke="#36a2eb" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#36a2eb" }}
                activeDot={{ r: 7 }}
                name="Postprandial (mg/dL)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'heart_rate':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="heartRate" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Heart Rate (bpm)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'cholesterol':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="cholesterol" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Cholesterol (mg/dL)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'weight':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Weight (kg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'temperature':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ff6384" 
                strokeWidth={2}
                dot={{ r: 5, fill: "#ff6384" }}
                activeDot={{ r: 7 }}
                name="Temperature (°F)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="vitals-chart">
      <div className="chart-controls">
        <div className="control-group">
          <label htmlFor="vitalType">Vital Type</label>
          <select
            id="vitalType"
            value={vitalType}
            onChange={(e) => setVitalType(e.target.value)}
          >
            <option value="blood_pressure">Blood Pressure</option>
            <option value="blood_sugar">Blood Sugar</option>
            <option value="heart_rate">Heart Rate</option>
            <option value="cholesterol">Cholesterol</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {startDate && endDate && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="btn-clear"
          >
            Clear Dates
          </button>
        )}
      </div>

      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default VitalsChart;

