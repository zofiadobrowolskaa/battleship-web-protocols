import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';

function AdminPanel() {

  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({ message: '' });
  const [loadingReports, setLoadingReports] = useState(false);

  const [gameHistory, setGameHistory] = useState([]);
  const [newGameRecord, setNewGameRecord] = useState({ winner: '', loser: '', reason: 'destruction' });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editingReason, setEditingReason] = useState('');

  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchReports(true);
    fetchGameHistory(true);
  }, []);

  const fetchReports = async (showLoader = false) => {
    if (showLoader) setLoadingReports(true);
    try {
      const response = await API.get('/admin/reports');
      setReports(response.data);
    } catch (err) {
      toast.error('Failed to load reports');
      console.error(err);
    } finally {
      if (showLoader) setLoadingReports(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    const currentUsername = sessionStorage.getItem('username');

    if (!currentUsername) {
      toast.error('You must be logged in to send a report');
      return;
    }
    if (!newReport.message) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await API.post('/admin/reports', { username: currentUsername, message: newReport.message });
      toast.success('Report created successfully');
      setNewReport({ message: '' });
      fetchReports(false);
    } catch (err) {
      toast.error('Failed to create report');
      console.error(err);
    }
  };

  const handleResolveReport = async (id, currentStatus) => {
    try {
      await API.put(`/admin/reports/${id}`, { is_resolved: !currentStatus });
      toast.success('Report updated');
      fetchReports(false);
    } catch (err) {
      toast.error('Failed to update report');
      console.error(err);
    }
  };

  const handleDeleteReport = (id) => {
    toast((t) => (
      <div className="confirm-toast">
        <span>Delete this report?</span>
        <div className="confirm-actions">
          <button
            className="btn-yes"
            onClick={() => confirmDeleteReport(id, t.id)}
          >
            Yes
          </button>
          <button
            className="btn-no"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000, icon: '⚠️' });
  };

  const confirmDeleteReport = async (id, toastId) => {
    toast.dismiss(toastId);
    try {
      await API.delete(`/admin/reports/${id}`);
      toast.success('Report deleted');
      fetchReports(false);
    } catch (err) {
      toast.error('Failed to delete report');
      console.error(err);
    }
  };

  const fetchGameHistory = async (showLoader = false) => {
    if (showLoader) setLoadingHistory(true);
    try {
      const response = await API.get('/admin/history');
      setGameHistory(response.data);
    } catch (err) {
      toast.error('Failed to load game history');
      console.error(err);
    } finally {
      if (showLoader) setLoadingHistory(false);
    }
  };

  const handleCreateGameHistory = async (e) => {
    e.preventDefault();
    if (!newGameRecord.winner || !newGameRecord.loser) {
      return toast.error('Fill in all fields');
    }
    try {
      await API.post('/admin/history', { 
        winner_username: newGameRecord.winner, 
        loser_username: newGameRecord.loser, 
        finish_reason: newGameRecord.reason 
      });
      toast.success('Record added manually');
      setNewGameRecord({ winner: '', loser: '', reason: 'destruction' });
      fetchGameHistory(false);
    } catch (err) {
      toast.error('Failed to add record');
    }
  };

  const handleEditHistory = (id, currentReason) => {
    setEditingHistoryId(id);
    setEditingReason(currentReason || 'destruction');
  };

  const handleSaveHistory = async (id) => {
    try {
      await API.put(`/admin/history/${id}`, { finish_reason: editingReason });
      toast.success('Game history updated');
      setEditingHistoryId(null);
      setEditingReason('');
      fetchGameHistory(false);
    } catch (err) {
      toast.error('Failed to update game history');
      console.error(err);
    }
  };

  const handleDeleteHistory = (id) => {
    toast((t) => (
      <div className="confirm-toast">
        <span>Delete this record?</span>
        <div className="confirm-actions">
          <button
            className="btn-yes"
            onClick={() => confirmDeleteHistory(id, t.id)}
          >
            Yes
          </button>
          <button
            className="btn-no"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000, icon: '⚠️' });
  };

  const confirmDeleteHistory = async (id, toastId) => {
    toast.dismiss(toastId);
    try {
      await API.delete(`/admin/history/${id}`);
      toast.success('Game record deleted');
      fetchGameHistory(false);
    } catch (err) {
      toast.error('Failed to delete game record');
      console.error(err);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage reports and game history</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Game History
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="admin-section">
          <h2>User Reports</h2>

          <form onSubmit={handleCreateReport} className="report-form">
            <textarea
              placeholder="Describe your issue or feedback..."
              value={newReport.message}
              onChange={(e) => setNewReport({ ...newReport, message: e.target.value })}
              rows="3"
            ></textarea>
            <button type="submit" className="btn-primary">Create Report</button>
          </form>

          <div className="reports-container">
            {loadingReports ? (
              <p>Loading reports...</p>
            ) : reports.length === 0 ? (
              <p>No reports yet</p>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report.id} className={`report-card ${report.is_resolved ? 'resolved' : 'pending'}`}>
                    <div className="report-header">
                      <div className="report-info">
                        <span className="report-author">📝 Created by: <strong>{report.username}</strong></span>
                        <span className="report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-badge ${report.is_resolved ? 'resolved' : 'pending'}`}>
                        {report.is_resolved ? '✓ Resolved' : 'Pending'}
                      </span>
                    </div>
                    <div className="report-content">
                      <p className="report-message">{report.message}</p>
                    </div>
                    <div className="report-actions">
                      <button
                        className="btn-toggle"
                        onClick={() => handleResolveReport(report.id, report.is_resolved)}
                        title={report.is_resolved ? 'Mark as pending' : 'Mark as resolved'}
                      >
                        {report.is_resolved ? '↩️ Mark Pending' : '✓ Mark Resolved'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteReport(report.id)}
                        title="Delete report"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="admin-section">
          <h2>Game History</h2>

          <form onSubmit={handleCreateGameHistory} className="report-form" style={{marginBottom: '2rem'}}>
            <h3>Add New Game Record (Manual, in case of emergency)</h3>
            <input type="text" placeholder="Winner Username" value={newGameRecord.winner} onChange={(e) => setNewGameRecord({...newGameRecord, winner: e.target.value})} />
            <input type="text" placeholder="Loser Username" value={newGameRecord.loser} onChange={(e) => setNewGameRecord({...newGameRecord, loser: e.target.value})} />
            <select value={newGameRecord.reason} onChange={(e) => setNewGameRecord({...newGameRecord, reason: e.target.value})} style={{padding: '0.75rem', borderRadius: '4px', border: '1px solid #444'}}>
              <option value="destruction">destruction</option>
              <option value="forfeit">forfeit</option>
            </select>
            <button type="submit" className="btn-primary">Add Record</button>
          </form>

          <div className="history-container">
            {loadingHistory ? (
              <p>Loading game history...</p>
            ) : gameHistory.length === 0 ? (
              <p>No game history yet</p>
            ) : (
              <div className="history-table-wrapper">
                <div className="history-table-header">
                  <div className="header-cell winner">Winner</div>
                  <div className="header-cell loser">Loser</div>
                  <div className="header-cell reason">Finish Reason</div>
                  <div className="header-cell date">Played At</div>
                  <div className="header-cell actions">Actions</div>
                </div>
                <div className="history-list">
                  {gameHistory.map((game) => (
                    <div key={game.id} className="history-row">
                      <div className="cell winner">
                        <span className="label">Winner</span>
                        <span className="value">{game.winner_username}</span>
                      </div>
                      <div className="cell loser">
                        <span className="label">Loser</span>
                        <span className="value">{game.loser_username}</span>
                      </div>
                      <div className="cell reason">
                        <span className="label">Finish Reason</span>
                        {editingHistoryId === game.id ? (
                          <select
                            value={editingReason}
                            onChange={(e) => setEditingReason(e.target.value)}
                            className="edit-input"
                          >
                            <option value="destruction">destruction</option>
                            <option value="forfeit">forfeit</option>
                          </select>
                        ) : (
                          <span className="value">{game.finish_reason || 'N/A'}</span>
                        )}
                      </div>
                      <div className="cell date">
                        <span className="label">Played At</span>
                        <span className="value">{new Date(game.played_at).toLocaleDateString()}</span>
                      </div>
                      <div className="cell actions">
                        {editingHistoryId === game.id ? (
                          <>
                            <button
                              className="btn-save"
                              onClick={() => handleSaveHistory(game.id)}
                              title="Save changes"
                            >
                              💾
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => setEditingHistoryId(null)}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => handleEditHistory(game.id, game.finish_reason)}
                              title="Edit reason"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteHistory(game.id)}
                              title="Delete record"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;