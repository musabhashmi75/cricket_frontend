import React, { useEffect, useState, useCallback } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import Chip from '@mui/material/Chip';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import Layout from '../components/layout/Layout';
import StatusChip from '../components/common/StatusChip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { matchApi } from '../api/matchApi';
import { teamApi } from '../api/teamApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';

const TABS = ['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'];

const EMPTY_FORM = {
  groundName: '', groundLocation: '', dateTime: '', totalAmount: '',
  description: '', status: 'UPCOMING', teamId: '', visibility: 'PUBLIC',
};

export default function MatchListPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [matches,       setMatches]       = useState([]);
  const [joinedIds,     setJoinedIds]     = useState(new Set());
  const [memberTeamIds, setMemberTeamIds] = useState(new Set());
  const [ownedTeams,    setOwnedTeams]    = useState([]);
  const [tab,           setTab]           = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast,         setToast]         = useState('');

  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');

  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Guest join dialog
  const [guestTarget,   setGuestTarget]   = useState(null);   // match being joined as guest
  const [guestName,     setGuestName]     = useState('');
  const [guestContact,  setGuestContact]  = useState('');
  const [guestLoading,  setGuestLoading]  = useState(false);
  const [guestError,    setGuestError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (user) {
        const [allMatches, dashboard, teams] = await Promise.all([
          matchApi.getAll(),
          dashboardApi.player(user.userId),
          teamApi.getAll(),
        ]);
        setMatches(allMatches);
        setJoinedIds(new Set(dashboard.matches.map(m => m.matchId)));
        setMemberTeamIds(new Set(teams.filter(t => t.member).map(t => t.id)));
        setOwnedTeams(teams.filter(t => t.owner));
      } else {
        // Guest: load public matches only, no auth required
        const allMatches = await matchApi.getAll();
        setMatches(allMatches);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (matchId) => {
    setActionLoading(matchId);
    try {
      await matchApi.join(matchId, user.userId);
      setJoinedIds(prev => new Set([...prev, matchId]));
      setToast('Joined match!');
    } catch (e) { setToast(e.message); }
    finally { setActionLoading(null); }
  };

  const handleLeave = async (matchId) => {
    setActionLoading(matchId);
    try {
      await matchApi.leave(matchId, user.userId);
      setJoinedIds(prev => { const s = new Set(prev); s.delete(matchId); return s; });
      setToast('Left match.');
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (match) => {
    setEditTarget(match);
    setForm({
      groundName:     match.groundName,
      groundLocation: match.groundLocation || '',
      dateTime:       dayjs(match.dateTime).format('YYYY-MM-DDTHH:mm'),
      totalAmount:    match.totalAmount,
      description:    match.description || '',
      status:         match.status,
      teamId:         match.teamId || '',
      visibility:     match.visibility || 'PUBLIC',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const setField = (field) => (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setFormError(''); };

  const handleSave = async () => {
    if (!form.groundName.trim() || !form.dateTime) {
      setFormError('Ground name and date/time are required.');
      return;
    }
    if (!editTarget && !form.teamId) {
      setFormError('Please select a team for this match.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        groundName:     form.groundName.trim(),
        groundLocation: form.groundLocation.trim() || null,
        dateTime:       form.dateTime,
        totalAmount:    form.totalAmount ? parseFloat(form.totalAmount) : null,
        description:    form.description.trim() || null,
        status:         form.status,
        visibility:     form.visibility,
        teamId:         form.teamId ? parseInt(form.teamId) : null,
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

  const handleComplete = async (matchId) => {
    setActionLoading(matchId);
    try {
      const updated = await matchApi.complete(matchId);
      setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
      setToast('Match marked as completed');
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleGuestJoin = async () => {
    if (!guestName.trim())    { setGuestError('Name is required.'); return; }
    if (!guestContact.trim()) { setGuestError('Phone or email is required.'); return; }
    setGuestLoading(true); setGuestError('');
    try {
      await matchApi.joinAsGuest(guestTarget.id, guestName.trim(), guestContact.trim());
      setToast(`Joined as guest! The organiser will contact you at ${guestContact.trim()}.`);
      setGuestTarget(null);
    } catch (e) {
      setGuestError(e.message);
    } finally {
      setGuestLoading(false);
    }
  };

  const visibleMatches = tab === 0 ? matches : matches.filter(m => m.status === TABS[tab]);

  // Can create a match only if they own at least one team
  const canCreateMatch = user && ownedTeams.length > 0;

  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Matches</Typography>
        {canCreateMatch && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
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

      {/* Guest banner */}
      {!user && (
        <Alert severity="info" sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => navigate('/login')}>Sign In</Button>}>
          You're browsing as a guest. Sign in to join teams, track payments, and see private matches.
        </Alert>
      )}

      <ErrorAlert message={error} onRetry={load} />

      {loading ? (
        <LoadingSpinner message="Loading matches…" />
      ) : visibleMatches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No matches found.</Typography>
          {canCreateMatch && (
            <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={openCreate}>
              Create the first match
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {visibleMatches.map(match => {
            const isMatchOwner = user && match.createdByUserId === user.userId;
            const canEdit = isAdmin || isMatchOwner;
            const isMemberOfTeam = !match.teamId || memberTeamIds.has(match.teamId);
            return (
              <Grid item xs={12} sm={6} md={4} key={match.id}>
                <MatchCard
                  match={match}
                  joined={joinedIds.has(match.id)}
                  canEdit={canEdit}
                  isGuest={!user}
                  isMemberOfTeam={isMemberOfTeam}
                  actionLoading={actionLoading === match.id}
                  onView={() => navigate(`/matches/${match.id}`)}
                  onJoin={() => handleJoin(match.id)}
                  onLeave={() => handleLeave(match.id)}
                  onEdit={() => openEdit(match)}
                  onDelete={() => setDeleteTarget(match)}
                  onComplete={() => handleComplete(match.id)}
                  onGoToTeam={() => navigate('/teams')}
                  onGuestJoin={() => { setGuestTarget(match); setGuestName(''); setGuestContact(''); setGuestError(''); }}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editTarget ? 'Edit Match' : 'Add New Match'}
          {isMobile && (
            <IconButton size="small" onClick={() => setDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Ground Name"
            value={form.groundName}
            onChange={setField('groundName')}
            required fullWidth
            placeholder="e.g. National Cricket Ground"
          />
          <TextField
            label="Ground Location"
            value={form.groundLocation}
            onChange={setField('groundLocation')}
            fullWidth
            placeholder="e.g. 123 Main Street, City"
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
            label="Total Amount (₹)"
            type="number"
            value={form.totalAmount}
            onChange={setField('totalAmount')}
            fullWidth
            inputProps={{ min: 0 }}
            placeholder="Optional"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={setField('description')}
            fullWidth multiline rows={2}
            placeholder="Optional notes about the match"
          />
          {/* Team selector — required on create */}
          {!editTarget && (
            <TextField
              select label="Team" required
              value={form.teamId}
              onChange={setField('teamId')}
              fullWidth
              helperText="Select the team this match belongs to"
            >
              <MenuItem value="" disabled>Select a team</MenuItem>
              {ownedTeams.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select label="Visibility"
            value={form.visibility}
            onChange={setField('visibility')}
            fullWidth
            helperText="Public = everyone can see. Private = team members only."
          >
            <MenuItem value="PUBLIC">Public</MenuItem>
            <MenuItem value="PRIVATE">Private</MenuItem>
          </TextField>
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

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
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

      {/* ── Guest Join Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!guestTarget} onClose={() => setGuestTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Join as Guest</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You're joining <b>{guestTarget?.groundName}</b> without an account.
            Provide your details so the organiser can reach you.
          </Typography>
          <TextField
            label="Your Name" required fullWidth
            value={guestName}
            onChange={e => { setGuestName(e.target.value); setGuestError(''); }}
            placeholder="e.g. John Doe"
          />
          <TextField
            label="Phone or Email" required fullWidth
            value={guestContact}
            onChange={e => { setGuestContact(e.target.value); setGuestError(''); }}
            placeholder="e.g. +91 98765 43210 or john@email.com"
            helperText="The match organiser will use this to contact you"
          />
          {guestError && <Alert severity="error">{guestError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGuestTarget(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleGuestJoin} disabled={guestLoading}>
            {guestLoading ? 'Joining…' : 'Join Match'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Layout>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, joined, canEdit, isGuest, isMemberOfTeam, actionLoading, onView, onJoin, onLeave, onEdit, onDelete, onComplete, onGoToTeam, onGuestJoin }) {
  const isUpcoming = match.status === 'UPCOMING';
  const isPrivate  = match.visibility === 'PRIVATE';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <StatusChip type="match" value={match.status} />
            <Chip
              size="small"
              icon={isPrivate ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <PublicIcon sx={{ fontSize: '14px !important' }} />}
              label={isPrivate ? 'Private' : 'Public'}
              color={isPrivate ? 'default' : 'info'}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {joined && (
              <Tooltip title="You joined"><PeopleIcon fontSize="small" color="success" /></Tooltip>
            )}
            {canEdit && isUpcoming && (
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
          <InfoRow icon={<EventIcon />} text={dayjs(match.dateTime).format('D MMM YYYY, h:mm A')} />
          {match.groundLocation && (
            <InfoRow icon={<LocationOnIcon />} text={match.groundLocation} />
          )}
          <InfoRow icon={<AttachMoneyIcon />} text={`Total: ₹${Number(match.totalAmount).toLocaleString()}`} />
          {match.perPersonAmount > 0 && (
            <InfoRow icon={<AttachMoneyIcon />} text={`Per Person: ₹${Number(match.perPersonAmount).toLocaleString()}`} />
          )}
          {match.teamName && (
            <InfoRow icon={<GroupsIcon />} text={match.teamName} />
          )}
          {match.description && !match.groundLocation && !match.teamName && (
            <InfoRow icon={<LocationOnIcon />} text={match.description} />
          )}
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={onView} sx={{ flex: 1 }}>
          View Details
        </Button>

        {canEdit && isUpcoming && (
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

        {isUpcoming && (
          isGuest ? (
            <Button size="small" variant="contained" color="success"
              onClick={onGuestJoin} sx={{ flex: 1 }}>
              Join as Guest
            </Button>
          ) : joined ? (
            <Button size="small" variant="contained" color="error"
              onClick={onLeave} disabled={actionLoading} sx={{ flex: 1 }}>
              {actionLoading ? 'Leaving…' : 'Leave'}
            </Button>
          ) : isMemberOfTeam ? (
            <Button size="small" variant="contained" color="success"
              onClick={onJoin} disabled={actionLoading} sx={{ flex: 1 }}>
              {actionLoading ? 'Joining…' : 'Join'}
            </Button>
          ) : (
            <Tooltip title="You must join the team first">
              <Button size="small" variant="outlined" color="warning"
                onClick={onGoToTeam} sx={{ flex: 1 }}>
                Join Team
              </Button>
            </Tooltip>
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
