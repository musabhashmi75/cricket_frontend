import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';

import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { teamApi } from '../api/teamApi';
import { useAuth } from '../context/AuthContext';

export default function TeamsPage() {
  const { user } = useAuth();

  const [teams,      setTeams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState(0);   // 0=All, 1=My Teams
  const [toast,      setToast]      = useState('');
  const [actionId,   setActionId]   = useState(null);

  // Create team dialog
  const [createOpen,  setCreateOpen]  = useState(false);
  const [form,        setForm]        = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // Members dialog
  const [membersTeam,    setMembersTeam]    = useState(null);
  const [members,        setMembers]        = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTeams(await teamApi.getAll());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError('Team name is required.'); return; }
    setFormLoading(true); setFormError('');
    try {
      const created = await teamApi.create({
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      setTeams(prev => [created, ...prev]);
      setToast('Team created!');
      setCreateOpen(false);
      setForm({ name: '', description: '' });
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoin = async (teamId) => {
    setActionId(teamId);
    try {
      await teamApi.join(teamId);
      setTeams(prev => prev.map(t => t.id === teamId
        ? { ...t, member: true, memberCount: t.memberCount + 1 }
        : t));
      setToast('Joined team!');
    } catch (e) {
      setToast(e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleLeave = async (teamId) => {
    setActionId(teamId);
    try {
      await teamApi.leave(teamId);
      setTeams(prev => prev.map(t => t.id === teamId
        ? { ...t, member: false, memberCount: t.memberCount - 1 }
        : t));
      setToast('Left team.');
    } catch (e) {
      setToast(e.message);
    } finally {
      setActionId(null);
    }
  };

  const openMembers = async (team) => {
    setMembersTeam(team);
    setMembersLoading(true);
    try {
      setMembers(await teamApi.getMembers(team.id));
    } catch (e) {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const visibleTeams = tab === 0 ? teams : teams.filter(t => t.member);

  return (
    <Layout>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Teams</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ name: '', description: '' }); setFormError(''); setCreateOpen(true); }}>
          Create Team
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All Teams" />
        <Tab label="My Teams" />
      </Tabs>

      <ErrorAlert message={error} onRetry={load} />

      {loading ? (
        <LoadingSpinner message="Loading teams…" />
      ) : visibleTeams.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            {tab === 1 ? "You haven't joined any teams yet." : "No teams yet. Create one!"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {visibleTeams.map(team => (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <TeamCard
                team={team}
                currentUserId={user.userId}
                actionLoading={actionId === team.id}
                onJoin={() => handleJoin(team.id)}
                onLeave={() => handleLeave(team.id)}
                onViewMembers={() => openMembers(team)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Create Team Dialog ───────────────────────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Team</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Team Name"
            value={form.name}
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError(''); }}
            required fullWidth
            placeholder="e.g. Weekend Warriors"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            fullWidth multiline rows={2}
            placeholder="Optional description"
          />
          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading}>
            {formLoading ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Members Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!membersTeam} onClose={() => setMembersTeam(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {membersTeam?.name} — Members
          <IconButton size="small" onClick={() => setMembersTeam(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          {membersLoading ? (
            <LoadingSpinner message="Loading members…" />
          ) : members.length === 0 ? (
            <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">No members.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Email</b></TableCell>
                    <TableCell><b>Joined</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {m.userName}
                        {m.userId === membersTeam?.createdByUserId && (
                          <Chip label="Owner" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                        )}
                        {m.userId === user.userId && (
                          <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                        )}
                      </TableCell>
                      <TableCell>{m.userEmail}</TableCell>
                      <TableCell>{dayjs(m.joinedAt).format('D MMM YYYY')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMembersTeam(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Layout>
  );
}

function TeamCard({ team, currentUserId, actionLoading, onJoin, onLeave, onViewMembers }) {
  const isOwner = team.owner;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {isOwner && <Chip icon={<StarIcon />} label="Owner" size="small" color="warning" />}
            {team.member && !isOwner && <Chip label="Member" size="small" color="success" />}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>{team.name}</Typography>

        {team.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {team.description}
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'} · Created by {team.createdByName}
          </Typography>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5, gap: 1 }}>
        <Button size="small" variant="outlined" onClick={onViewMembers} sx={{ flex: 1 }}>
          Members
        </Button>
        {!isOwner && (
          team.member ? (
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
