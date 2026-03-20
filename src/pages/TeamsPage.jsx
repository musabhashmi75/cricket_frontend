import React, { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
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
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';

import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { teamApi } from '../api/teamApi';
import { useAuth } from '../context/AuthContext';

// Converts absolute backend URL to relative path for Vercel proxy
function toProxiedUrl(url) {
  if (!url) return null;
  try { return new URL(url).pathname; } catch { return url; }
}

export default function TeamsPage() {
  const { user } = useAuth();

  const [teams,      setTeams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState(0);
  const [toast,      setToast]      = useState('');
  const [actionId,   setActionId]   = useState(null);

  // Create dialog
  const [createOpen,  setCreateOpen]  = useState(false);
  const [createForm,  setCreateForm]  = useState({ name: '', description: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,   setCreateError]   = useState('');

  // Edit dialog
  const [editTarget,  setEditTarget]  = useState(null);   // team being edited
  const [editForm,    setEditForm]    = useState({ name: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState('');
  const [bannerFile,  setBannerFile]  = useState(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const bannerRef = useRef(null);

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

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name.trim()) { setCreateError('Team name is required.'); return; }
    setCreateLoading(true); setCreateError('');
    try {
      const created = await teamApi.create({
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
      });
      setTeams(prev => [created, ...prev]);
      setToast('Team created!');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '' });
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (team) => {
    setEditTarget(team);
    setEditForm({ name: team.name, description: team.description || '' });
    setEditError('');
    setBannerFile(null);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { setEditError('Team name is required.'); return; }
    setEditLoading(true); setEditError('');
    try {
      let updated = await teamApi.update(editTarget.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
      // Upload banner if a new file was selected
      if (bannerFile) {
        setBannerLoading(true);
        updated = await teamApi.uploadBanner(editTarget.id, bannerFile);
        setBannerLoading(false);
      }
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
      setToast('Team updated!');
      setEditTarget(null);
      setBannerFile(null);
    } catch (e) {
      setEditError(e.message);
      setBannerLoading(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setEditError('Only JPG, PNG, GIF or WebP images are accepted for the banner.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Banner image must not exceed 5 MB.');
      return;
    }
    setEditError('');
    setBannerFile(file);
  };

  // ── Join / Leave ──────────────────────────────────────────────────────────
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

  // ── Members ───────────────────────────────────────────────────────────────
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
        <Typography variant="h5" fontWeight={700}>Teams</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small"
          onClick={() => { setCreateForm({ name: '', description: '' }); setCreateError(''); setCreateOpen(true); }}>
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
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {visibleTeams.map(team => (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <TeamCard
                team={team}
                currentUserId={user.userId}
                actionLoading={actionId === team.id}
                onJoin={() => handleJoin(team.id)}
                onLeave={() => handleLeave(team.id)}
                onViewMembers={() => openMembers(team)}
                onEdit={() => openEdit(team)}
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
            label="Team Name" required fullWidth
            value={createForm.name}
            onChange={e => { setCreateForm(p => ({ ...p, name: e.target.value })); setCreateError(''); }}
            placeholder="e.g. Weekend Warriors"
          />
          <TextField
            label="Description" fullWidth multiline rows={2}
            value={createForm.description}
            onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Optional description"
          />
          {createError && <Alert severity="error">{createError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}>
            {createLoading ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Team Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Team
          <IconButton size="small" onClick={() => setEditTarget(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {(editLoading || bannerLoading) && <LinearProgress />}

          <TextField
            label="Team Name" required fullWidth
            value={editForm.name}
            onChange={e => { setEditForm(p => ({ ...p, name: e.target.value })); setEditError(''); }}
          />
          <TextField
            label="Description" fullWidth multiline rows={2}
            value={editForm.description}
            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
          />

          {/* Banner upload */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Team Banner / Display Picture
            </Typography>
            {/* Preview: new file takes priority, else existing banner */}
            {(bannerFile || editTarget?.bannerUrl) && (
              <Box
                component="img"
                src={bannerFile ? URL.createObjectURL(bannerFile) : toProxiedUrl(editTarget.bannerUrl)}
                alt="Banner preview"
                sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1, mb: 1 }}
              />
            )}
            <input
              ref={bannerRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleBannerChange}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => bannerRef.current?.click()}
              size="small"
            >
              {bannerFile ? bannerFile.name : editTarget?.bannerUrl ? 'Replace Banner' : 'Upload Banner'}
            </Button>
            {bannerFile && (
              <Button size="small" color="inherit" sx={{ ml: 1 }}
                onClick={() => { setBannerFile(null); if (bannerRef.current) bannerRef.current.value = ''; }}>
                Remove
              </Button>
            )}
          </Box>

          {editError && <Alert severity="error">{editError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditTarget(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editLoading || bannerLoading}>
            {editLoading || bannerLoading ? 'Saving…' : 'Save Changes'}
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
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><b>Email</b></TableCell>
                    <TableCell><b>Joined</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Typography variant="body2">{m.userName}</Typography>
                        <Typography variant="caption" color="text.secondary"
                          sx={{ display: { xs: 'block', sm: 'none' } }}>
                          {m.userEmail}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                          {m.userId === membersTeam?.createdByUserId && (
                            <Chip label="Owner" size="small" color="warning" sx={{ height: 16, fontSize: 10 }} />
                          )}
                          {m.userId === user.userId && (
                            <Chip label="You" size="small" sx={{ height: 16, fontSize: 10 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{m.userEmail}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(m.joinedAt).format('D MMM YY')}</TableCell>
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

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, actionLoading, onJoin, onLeave, onViewMembers, onEdit }) {
  const isOwner   = team.owner;
  const bannerUrl = toProxiedUrl(team.bannerUrl);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Banner */}
      {bannerUrl ? (
        <CardMedia component="img" height="120" image={bannerUrl} alt={`${team.name} banner`} />
      ) : (
        <Box sx={{ height: 120, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, opacity: 0.6 }}>
            {team.name.charAt(0).toUpperCase()}
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {isOwner && <Chip icon={<StarIcon />} label="Owner" size="small" color="warning" />}
            {team.member && !isOwner && <Chip label="Member" size="small" color="success" />}
          </Box>
          {isOwner && (
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Typography variant="h6" gutterBottom>{team.name}</Typography>

        {team.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {team.description}
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'} · {team.createdByName}
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
