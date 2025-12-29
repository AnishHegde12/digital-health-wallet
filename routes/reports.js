const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

router.post('/upload', authenticateToken, upload.single('report'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { reportType, date, vitals } = req.body;
    const userId = req.user.id;

    if (!reportType || !date) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Report type and date are required' });
    }

    const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();

    db.run(
      'INSERT INTO reports (user_id, filename, original_filename, file_type, report_type, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, req.file.filename, req.file.originalname, fileType, reportType, date],
      function(err) {
        if (err) {
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ error: 'Failed to save report' });
        }

        const reportId = this.lastID;

        if (vitals) {
          try {
            const vitalsData = typeof vitals === 'string' ? JSON.parse(vitals) : vitals;
            insertVitals(userId, reportId, vitalsData, date);
          } catch (parseErr) {
            console.error('Error parsing vitals:', parseErr);
          }
        }

        res.status(201).json({
          message: 'Report uploaded successfully',
          report: {
            id: reportId,
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            reportType,
            date
          }
        });
      }
    );
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

function insertVitals(userId, reportId, vitalsData, date) {
  const {
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodSugarFasting,
    bloodSugarPostprandial,
    heartRate,
    temperature,
    weight,
    height,
    cholesterol
  } = vitalsData;

  db.run(
    `INSERT INTO vitals (
      user_id, report_id, blood_pressure_systolic, blood_pressure_diastolic,
      blood_sugar_fasting, blood_sugar_postprandial, heart_rate, temperature,
      weight, height, cholesterol, date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, reportId || null,
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
    (err) => {
      if (err) {
        console.error('Error inserting vitals:', err);
      }
    }
  );
}

router.get('/', authenticateToken, (req, res) => {
  const { date, reportType, vitalType } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT r.*, 
           (SELECT COUNT(*) FROM access_shares WHERE report_id = r.id) as share_count
    FROM reports r
    WHERE r.user_id = ?
  `;
  const params = [userId];

  if (date) {
    query += ' AND r.date = ?';
    params.push(date);
  }

  if (reportType) {
    query += ' AND r.report_type = ?';
    params.push(reportType);
  }

  if (vitalType) {
    query += ` AND EXISTS (
      SELECT 1 FROM vitals v 
      WHERE v.report_id = r.id 
      AND (
        (v.blood_pressure_systolic IS NOT NULL AND ? = 'blood_pressure') OR
        (v.blood_sugar_fasting IS NOT NULL AND ? = 'blood_sugar') OR
        (v.heart_rate IS NOT NULL AND ? = 'heart_rate') OR
        (v.cholesterol IS NOT NULL AND ? = 'cholesterol')
      )
    )`;
    params.push(vitalType, vitalType, vitalType, vitalType);
  }

  query += ' ORDER BY r.date DESC, r.created_at DESC';

  db.all(query, params, (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
    res.json(reports);
  });
});

router.get('/shared', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT r.*, as_table.role, as_table.owner_id,
           u.username as owner_username
    FROM reports r
    INNER JOIN access_shares as_table ON r.id = as_table.report_id
    LEFT JOIN users u ON as_table.owner_id = u.id
    WHERE as_table.shared_with_user_id = ?
    ORDER BY r.date DESC, r.created_at DESC
  `;

  db.all(query, [userId], (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch shared reports' });
    }
    res.json(reports);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT r.*
    FROM reports r
    WHERE r.id = ? AND (
      r.user_id = ? OR
      EXISTS (
        SELECT 1 FROM access_shares 
        WHERE report_id = r.id AND shared_with_user_id = ?
      )
    )
  `;

  db.get(query, [id, userId, userId], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    db.all('SELECT * FROM vitals WHERE report_id = ?', [id], (err, vitals) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch vitals' });
      }

      res.json({
        ...report,
        vitals: vitals.length > 0 ? vitals[0] : null
      });
    });
  });
});

router.get('/:id/download', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT r.*
    FROM reports r
    WHERE r.id = ? AND (
      r.user_id = ? OR
      EXISTS (
        SELECT 1 FROM access_shares 
        WHERE report_id = r.id AND shared_with_user_id = ?
      )
    )
  `;

  db.get(query, [id, userId, userId], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const filePath = path.join(uploadsDir, report.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, report.original_filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM reports WHERE id = ? AND user_id = ?', [id, userId], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const filePath = path.join(uploadsDir, report.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.run('DELETE FROM reports WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete report' });
      }

      res.json({ message: 'Report deleted successfully' });
    });
  });
});

module.exports = router;

