const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const {
      reportId,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      bloodSugarFasting,
      bloodSugarPostprandial,
      heartRate,
      temperature,
      weight,
      height,
      cholesterol,
      date
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    db.run(
      `INSERT INTO vitals (
        user_id, report_id, blood_pressure_systolic, blood_pressure_diastolic,
        blood_sugar_fasting, blood_sugar_postprandial, heart_rate, temperature,
        weight, height, cholesterol, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        reportId || null,
        bloodPressureSystolic || null,
        bloodPressureDiastolic || null,
        bloodSugarFasting || null,
        bloodSugarPostprandial || null,
        heartRate || null,
        temperature || null,
        weight || null,
        height || null,
        cholesterol || null,
        date
      ],
      function(err) {
        if (err) {
          console.error('Error inserting vitals:', err);
          return res.status(500).json({ error: 'Failed to save vitals' });
        }

        res.status(201).json({
          message: 'Vitals saved successfully',
          id: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to save vitals' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, vitalType } = req.query;

  let query = 'SELECT * FROM vitals WHERE user_id = ?';
  const params = [userId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date ASC, created_at ASC';

  db.all(query, params, (err, vitals) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch vitals' });
    }

    let filteredVitals = vitals;
    if (vitalType) {
      filteredVitals = vitals.filter(vital => {
        switch (vitalType) {
          case 'blood_pressure':
            return vital.blood_pressure_systolic !== null;
          case 'blood_sugar':
            return vital.blood_sugar_fasting !== null || vital.blood_sugar_postprandial !== null;
          case 'heart_rate':
            return vital.heart_rate !== null;
          case 'cholesterol':
            return vital.cholesterol !== null;
          case 'weight':
            return vital.weight !== null;
          case 'temperature':
            return vital.temperature !== null;
          default:
            return true;
        }
      });
    }

    res.json(filteredVitals);
  });
});

router.get('/trends', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, vitalType } = req.query;

  let query = 'SELECT date, ';
  const params = [];

  switch (vitalType) {
    case 'blood_pressure':
      query += 'blood_pressure_systolic, blood_pressure_diastolic ';
      break;
    case 'blood_sugar':
      query += 'blood_sugar_fasting, blood_sugar_postprandial ';
      break;
    case 'heart_rate':
      query += 'heart_rate ';
      break;
    case 'cholesterol':
      query += 'cholesterol ';
      break;
    case 'weight':
      query += 'weight ';
      break;
    case 'temperature':
      query += 'temperature ';
      break;
    default:
      query += 'blood_pressure_systolic, blood_pressure_diastolic, blood_sugar_fasting, heart_rate, cholesterol, weight, temperature ';
  }

  query += 'FROM vitals WHERE user_id = ?';
  params.push(userId);

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date ASC';

  db.all(query, params, (err, vitals) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch vitals trends' });
    }

    const formattedData = vitals.map(vital => {
      const dataPoint = { date: vital.date };

      if (vitalType === 'blood_pressure') {
        dataPoint.systolic = vital.blood_pressure_systolic;
        dataPoint.diastolic = vital.blood_pressure_diastolic;
      } else if (vitalType === 'blood_sugar') {
        dataPoint.fasting = vital.blood_sugar_fasting;
        dataPoint.postprandial = vital.blood_sugar_postprandial;
      } else {
        if (vital.blood_pressure_systolic) dataPoint.systolic = vital.blood_pressure_systolic;
        if (vital.blood_pressure_diastolic) dataPoint.diastolic = vital.blood_pressure_diastolic;
        if (vital.blood_sugar_fasting) dataPoint.fasting = vital.blood_sugar_fasting;
        if (vital.blood_sugar_postprandial) dataPoint.postprandial = vital.blood_sugar_postprandial;
        if (vital.heart_rate) dataPoint.heartRate = vital.heart_rate;
        if (vital.cholesterol) dataPoint.cholesterol = vital.cholesterol;
        if (vital.weight) dataPoint.weight = vital.weight;
        if (vital.temperature) dataPoint.temperature = vital.temperature;
      }

      return dataPoint;
    });

    res.json(formattedData);
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodSugarFasting,
    bloodSugarPostprandial,
    heartRate,
    temperature,
    weight,
    height,
    cholesterol,
    date
  } = req.body;

  db.get('SELECT * FROM vitals WHERE id = ? AND user_id = ?', [id, userId], (err, vital) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!vital) {
      return res.status(404).json({ error: 'Vital entry not found or access denied' });
    }

    db.run(
      `UPDATE vitals SET
        blood_pressure_systolic = ?,
        blood_pressure_diastolic = ?,
        blood_sugar_fasting = ?,
        blood_sugar_postprandial = ?,
        heart_rate = ?,
        temperature = ?,
        weight = ?,
        height = ?,
        cholesterol = ?,
        date = ?
      WHERE id = ? AND user_id = ?`,
      [
        bloodPressureSystolic !== undefined ? bloodPressureSystolic : vital.blood_pressure_systolic,
        bloodPressureDiastolic !== undefined ? bloodPressureDiastolic : vital.blood_pressure_diastolic,
        bloodSugarFasting !== undefined ? bloodSugarFasting : vital.blood_sugar_fasting,
        bloodSugarPostprandial !== undefined ? bloodSugarPostprandial : vital.blood_sugar_postprandial,
        heartRate !== undefined ? heartRate : vital.heart_rate,
        temperature !== undefined ? temperature : vital.temperature,
        weight !== undefined ? weight : vital.weight,
        height !== undefined ? height : vital.height,
        cholesterol !== undefined ? cholesterol : vital.cholesterol,
        date || vital.date,
        id,
        userId
      ],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update vitals' });
        }

        res.json({ message: 'Vitals updated successfully' });
      }
    );
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM vitals WHERE id = ? AND user_id = ?', [id, userId], (err, vital) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!vital) {
      return res.status(404).json({ error: 'Vital entry not found or access denied' });
    }

    db.run('DELETE FROM vitals WHERE id = ? AND user_id = ?', [id, userId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete vitals' });
      }

      res.json({ message: 'Vitals deleted successfully' });
    });
  });
});

module.exports = router;

