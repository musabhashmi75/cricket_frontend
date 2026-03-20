import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { userApi } from '../api/userApi';

export default function AdminUsersPage() {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [toast,    setToast]   = useState('');

  // Reset password dialog state
  const [resetTarget,  setResetTarget]  = useState(null); // user object
  const [newPassword,  setNewPassword]  = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState('');

  // Create user dialog state
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState({ name: '', email: '', password: '', role: 'PLAYER' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,  setCreateError]  = useState('');
  const [showCreatePw, setShowCreatePw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await userApi.getAll());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Reset password ─────────────────────────────────────────────────────────
  const openReset  = (user)  => { setResetTarget(user); setNewPassword(''); setResetError(''); setShowPw(false); };
  const closeReset = ()      => setResetTarget(null);

  const handleReset = async () => {
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
    setResetLoading(true);
    setResetError('');
    try {
      await userApi.resetPassword(resetTarget.id, newPassword);
      setToast(`Password reset for ${resetTarget.name}`);
      // Refresh user list so passwordResetRequired flag updates
      setUsers(prev => prev.map(u => u.id === resetTarget.id ? { ...u, passwordResetRequired: true } : u));
      closeReset();
    } catch (e) {
      setResetError(e.message);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Create user ────────────────────────────────────────────────────────────
  const setCreate = (field) => (e) => setCreateForm(p => ({ ...p, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || createForm.password.length < 6) {
      setCreateError('All fields required. Password min 6 characters.');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const created = await userApi.create(createForm);
      setUsers(prev => [...prev, created]);
      setToast(`User "${created.name}" created`);
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'PLAYER' });
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}
          size="small">
          New User
        </Button>
      </Box>

      <ErrorAlert message={error} onRetry={load} />

      {loading ? <LoadingSpinner message="Loading users…" /> : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>User</b></TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><b>Role</b></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><b>Password Status</b></TableCell>
                    <TableCell align="right"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(user => (
                    <TableRow
                      key={user.id}
                      sx={{ bgcolor: user.passwordResetRequired ? 'warning.50' : 'inherit' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: user.role === 'ADMIN' ? 'warning.main' : 'primary.main' }}>
                            {user.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary"
                              sx={{ display: { xs: 'none', sm: 'block' } }}>
                              {user.email}
                            </Typography>
                            {/* Role chip inline on xs */}
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5, mt: 0.25, alignItems: 'center' }}>
                              <Chip label={user.role} size="small"
                                color={user.role === 'ADMIN' ? 'warning' : 'default'}
                                variant="filled" sx={{ fontWeight: 700, height: 16, fontSize: 10 }} />
                              {user.passwordResetRequired && (
                                <Tooltip title="Password reset required">
                                  <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip
                          label={user.role}
                          size="small"
                          color={user.role === 'ADMIN' ? 'warning' : 'default'}
                          variant="filled"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {user.passwordResetRequired ? (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="Reset required"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip label="Active" color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Reset Password">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => openReset(user)}
                            sx={{ minWidth: { xs: 36, sm: 'auto' }, px: { xs: 1, sm: 1.5 } }}
                          >
                            <LockResetIcon fontSize="small" sx={{ mr: { xs: 0, sm: 0.5 } }} />
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Reset</Box>
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Reset Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!resetTarget} onClose={closeReset} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {resetTarget && (
            <Alert severity="warning">
              Resetting password for <b>{resetTarget.name}</b>. They will be prompted to change it on next login.
            </Alert>
          )}
          <TextField
            label="New Password"
            type={showPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setResetError(''); }}
            fullWidth
            helperText="Minimum 6 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small">
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {resetError && <Alert severity="error">{resetError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeReset} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReset} disabled={resetLoading}>
            {resetLoading ? 'Resetting…' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create User Dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Full Name" value={createForm.name}  onChange={setCreate('name')}  fullWidth required />
          <TextField label="Email"     value={createForm.email} onChange={setCreate('email')} fullWidth required type="email" />
          <TextField
            label="Temporary Password"
            value={createForm.password}
            onChange={setCreate('password')}
            fullWidth required
            type={showCreatePw ? 'text' : 'password'}
            helperText="User will be prompted to change this"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCreatePw(v => !v)} edge="end" size="small">
                    {showCreatePw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={createForm.role} onChange={setCreate('role')} label="Role">
              <MenuItem value="PLAYER">Player</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
          {createError && <Alert severity="error">{createError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}>
            {createLoading ? 'Creating…' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Layout>
  );
}
