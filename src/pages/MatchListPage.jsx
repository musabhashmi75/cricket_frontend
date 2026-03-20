import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import Layout from '../components/layout/Layout';
import StatusChip from '../components/common/StatusChip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { matchApi } from '../api/matchApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';

const TABS = ['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'];

const EMPTY_FORM = { groundName: '', dateTime: '', totalAmount: '', description: '', status: 'UPCOMING' };

export default function MatchListPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [matches,       setMatches]       = useState([]);
  const [joinedIds,     setJoinedIds]     = useState(new Set());
  const [tab,           setTab]           = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast,         setToast]         = useState('');

  // Create / Edit dialog
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);   // null = create, object = edit
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');

  // Delete confirm dialog
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allMatches, dashboard] = await Promise.all([
        matchApi.getAll(),
        !isAdmin ? dashboardApi.player(user.userId) : Promise.resolve(null),
      ]);
      setMatches(allMatches);
      if (dashboard) setJoinedIds(new Set(dashboard.matches.map(m => m.matchId)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user.userId]);

  useEffect(() => { load(); }, [load]);

  // ── Join / Leave ──────────────────────────────────────────────────────────
  const handleJoin = async (matchId) => {
    setActionLoading(matchId);
    try {
      await matchApi.join(matchId, user.userId);
      setJoinedIds(prev => new Set([...prev, matchId]));
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleLeave = async (matchId) => {
    setActionLoading(matchId);
    try {
      await matchApi.leave(matchId, user.userId);
      setJoinedIds(prev => { const s = new Set(prev); s.delete(matchId); return s; });
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  // ── Create / Edit dialog ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (match) => {
    setEditTarget(match);
    setForm({
      groundName:  match.groundName,
      dateTime:    dayjs(match.dateTime).format('YYYY-MM-DDTHH:mm'),
      totalAmount: match.totalAmount,
      description: match.description || '',
      status:      match.status,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const setField = (field) => (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setFormError(''); };

  const handleSave = async () => {
    if (!form.groundName.trim() || !form.dateTime || !form.totalAmount) {
      setFormError('Ground name, date/time and total amount are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        groundName:  form.groundName.trim(),
        dateTime:    form.dateTime,        // ISO string, backend accepts it
        totalAmount: parseFloat(form.totalAmount),
        description: form.description.trim() || null,
        status:      form.status,
      };

      if (editTarget) {
        const updated = await matchApi.update(editTarget.id, payload);
        setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
        setToast('Match updated');
      } else {
        const created = await matchApi.create(payload);
        setMatches(prev => [created, ...prev]);
        setToast('Match created');
      }
      setDialogOpen(false);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await matchApi.remove(deleteTarget.id);
      setMatches(prev => prev.filter(m => m.id !== deleteTarget.id));
      setToast('Match deleted');
      setDeleteTarget(null);
    } catch (e) {
      setError(e.message);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Complete ──────────────────────────────────────────────────────────────
  const handleComplete = async (matchId) => {
    setActionLoading(matchId);
    try {
      const updated = await matchApi.complete(matchId);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
      setToast('Match marked as completed');
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const visibleMatches = tab === 0 ? matches : matches.filter(m => m.status === TABS[tab]);

  return (
    <Layout>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Matches</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Match
          </Button>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable" scrollButtons="auto"
      >
        {TABS.map((label, i) => <Tab key={label} label={label} id={`tab-${i}`} />)}
      </Tabs>

      <ErrorAlert message={error} onRetry={load} />

      {loading ? (
        <LoadingSpinner message="Loading matches…" />
      ) : visibleMatches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No matches found.</Typography>
          {isAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={openCreate}>
              Create the first match
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {visibleMatches.map(match => (
            <Grid item xs={12} sm={6} md={4} key={match.id}>
              <MatchCard
                match={match}
                joined={joinedIds.has(match.id)}
                isAdmin={isAdmin}
                actionLoading={actionLoading === match.id}
                onView={() => navigate(`/matches/${match.id}`)}
                onJoin={() => handleJoin(match.id)}
                onLeave={() => handleLeave(match.id)}
                onEdit={() => openEdit(match)}
                onDelete={() => setDeleteTarget(match)}
                onComplete={() => handleComplete(match.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Match' : 'Add New Match'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Ground Name"
            value={form.groundName}
            onChange={setField('groundName')}
            required fullWidth
            placeholder="e.g. National Cricket Ground"
          />
          <TextField
            label="Date & Time"
            type="datetime-local"
            value={form.dateTime}
            onChange={setField('dateTime')}
            required fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Total Amount (PKR)"
            type="number"
            value={form.totalAmount}
            onChange={setField('totalAmount')}
            required fullWidth
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={setField('description')}
            fullWidth multiline rows={2}
            placeholder="Optional notes about the match"
          />
          {editTarget && (
            <TextField
              select label="Status"
              value={form.status}
              onChange={setField('status')}
              fullWidth
            >
              <MenuItem value="UPCOMING">Upcoming</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          )}
          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={formLoading}>
            {formLoading ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Match'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Match?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This will permanently delete <b>{deleteTarget?.groundName}</b> and all its player and payment records.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Layout>
  );
}

// ─── Match Card ──────────────────────────────────────────────────────────────
function MatchCard({ match, joined, isAdmin, actionLoading, onView, onJoin, onLeave, onEdit, onDelete, onComplete }) {
  const isUpcoming = match.status === 'UPCOMING';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <StatusChip type="match" value={match.status} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {joined && (
              <Tooltip title="You joined"><PeopleIcon fontSize="small" color="success" /></Tooltip>
            )}
            {isAdmin && isUpcoming && (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom noWrap>{match.groundName}</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 2 }}>
          <InfoRow icon={<EventIcon />} text={dayjs(match.dateTime).format('D MMM YYYY, h:mm A')} />
          <InfoRow icon={<AttachMoneyIcon />} text={`Total: PKR ${Number(match.totalAmount).toLocaleString()}`} />
          {match.perPersonAmount > 0 && (
            <InfoRow icon={<AttachMoneyIcon />} text={`Per Person: PKR ${Number(match.perPersonAmount).toLocaleString()}`} />
          )}
          {match.description && (
            <InfoRow icon={<LocationOnIcon />} text={match.description} />
          )}
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={onView} sx={{ flex: 1 }}>
          View Details
        </Button>

        {/* Admin: mark as complete */}
        {isAdmin && isUpcoming && (
          <Tooltip title="Mark as completed and calculate per-person amount">
            <Button
              size="small" variant="contained" color="success"
              startIcon={<CheckCircleIcon />}
              onClick={onComplete} disabled={actionLoading}
              sx={{ flex: 1 }}
            >
              {actionLoading ? '…' : 'Complete'}
            </Button>
          </Tooltip>
        )}

        {/* Player: join / leave */}
        {!isAdmin && isUpcoming && (
          joined ? (
            <Button size="small" variant="contained" color="error"
              onClick={onLeave} disabled={actionLoading} sx={{ flex: 1 }}>
              {actionLoading ? 'Leaving…' : 'Leave'}
            </Button>
          ) : (
            <Button size="small" variant="contained" color="success"
              onClick={onJoin} disabled={actionLoading} sx={{ flex: 1 }}>
              {actionLoading ? 'Joining…' : 'Join'}
            </Button>
          )
        )}
      </CardActions>
    </Card>
  );
}

function InfoRow({ icon, text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', fontSize: 18 }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" noWrap>{text}</Typography>
    </Box>
  );
}
