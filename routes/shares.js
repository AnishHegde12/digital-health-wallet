const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.post('/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const ownerId = req.user.id;
    const { sharedWithEmail, role = 'viewer' } = req.body;

    if (!sharedWithEmail) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be viewer or editor' });
    }

    db.get('SELECT * FROM reports WHERE id = ? AND user_id = ?', [reportId, ownerId], (err, report) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found or access denied' });
      }

      db.get('SELECT id FROM users WHERE email = ?', [sharedWithEmail], (err, sharedUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!sharedUser) {
          return res.status(404).json({ error: 'User with this email not found' });
        }

        if (sharedUser.id === ownerId) {
          return res.status(400).json({ error: 'Cannot share report with yourself' });
        }

        db.get(
          'SELECT * FROM access_shares WHERE report_id = ? AND shared_with_user_id = ?',
          [reportId, sharedUser.id],
          (err, existingShare) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (existingShare) {
              db.run(
                'UPDATE access_shares SET role = ? WHERE id = ?',
                [role, existingShare.id],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to update share' });
                  }

                  res.json({ message: 'Share updated successfully' });
                }
              );
            } else {
              db.run(
                'INSERT INTO access_shares (report_id, owner_id, shared_with_user_id, shared_with_email, role) VALUES (?, ?, ?, ?, ?)',
                [reportId, ownerId, sharedUser.id, sharedWithEmail, role],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to create share' });
                  }

                  res.status(201).json({
                    message: 'Report shared successfully',
                    shareId: this.lastID
                  });
                }
              );
            }
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share report' });
  }
});

router.get('/report/:reportId', authenticateToken, (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM reports WHERE id = ? AND user_id = ?', [reportId, userId], (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!report) {
        return res.status(404).json({ error: 'Report not found or access denied' });
      }

      const query = `
      SELECT as_table.*, u.username, u.email
      FROM access_shares as_table
      LEFT JOIN users u ON as_table.shared_with_user_id = u.id
      WHERE as_table.report_id = ?
      ORDER BY as_table.created_at DESC
    `;

    db.all(query, [reportId], (err, shares) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch shares' });
      }

      res.json(shares);
    });
  });
});

router.get('/shared-with-me', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT r.*, as_table.role, as_table.created_at as shared_at,
           u.username as owner_username, u.email as owner_email
    FROM reports r
    INNER JOIN access_shares as_table ON r.id = as_table.report_id
    LEFT JOIN users u ON as_table.owner_id = u.id
    WHERE as_table.shared_with_user_id = ?
    ORDER BY as_table.created_at DESC
  `;

  db.all(query, [userId], (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch shared reports' });
    }

    res.json(reports);
  });
});

router.delete('/:shareId', authenticateToken, (req, res) => {
  const { shareId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT as_table.* FROM access_shares as_table
     INNER JOIN reports r ON as_table.report_id = r.id
     WHERE as_table.id = ? AND r.user_id = ?`,
    [shareId, userId],
    (err, share) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!share) {
        return res.status(404).json({ error: 'Share not found or access denied' });
      }

      db.run('DELETE FROM access_shares WHERE id = ?', [shareId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to revoke access' });
        }

        res.json({ message: 'Access revoked successfully' });
      });
    }
  );
});

module.exports = router;

