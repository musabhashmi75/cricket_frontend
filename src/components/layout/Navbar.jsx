import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';

export default function Navbar() {
  const { user, logout, isAdmin, clearPasswordResetFlag } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // User menu
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = ()  => setAnchorEl(null);

  // Change password dialog
  const [pwOpen,   setPwOpen]   = useState(false);
  const [current,  setCurrent]  = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [showC,    setShowC]    = useState(false);
  const [showN,    setShowN]    = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,  setPwError]  = useState('');
  const [pwDone,   setPwDone]   = useState(false);

  const openChangePw = () => {
    closeMenu();
    setCurrent(''); setNewPw(''); setPwError(''); setPwDone(false);
    setPwOpen(true);
  };

  const handleChangePw = async () => {
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    setPwLoading(true); setPwError('');
    try {
      await authApi.changePassword(current, newPw);
      clearPasswordResetFlag();
      setPwDone(true);
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => { closeMenu(); logout(); navigate('/login'); };

  const navItems = [
    { label: 'Matches',   path: '/matches' },
    { label: 'Dashboard', path: '/dashboard' },
    ...(isAdmin ? [{ label: 'Users', path: '/admin/users', icon: <PeopleIcon sx={{ fontSize: 16 }} /> }] : []),
  ];

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <Toolbar sx={{ gap: 1 }}>
          <SportsCricketIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            sx={{ flexGrow: 0, cursor: 'pointer', mr: 3, fontWeight: 700 }}
            onClick={() => navigate('/matches')}
          >
            Cricket Manager
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
            {navItems.map(({ label, path }) => (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={{
                  fontWeight: location.pathname.startsWith(path) ? 700 : 400,
                  borderBottom: location.pathname.startsWith(path)
                    ? '2px solid white' : '2px solid transparent',
                  borderRadius: 0,
                  pb: '6px',
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Password reset warning badge */}
              {user.passwordResetRequired && (
                <Tooltip title="Please change your password">
                  <Chip
                    icon={<WarningAmberIcon />}
                    label="Change password"
                    color="warning"
                    size="small"
                    onClick={openChangePw}
                    sx={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              )}

              <Chip
                label={user.role}
                size="small"
                sx={{
                  bgcolor: user.role === 'ADMIN' ? 'warning.main' : 'success.main',
                  color: 'white',
                  fontWeight: 700,
                  display: { xs: 'none', sm: 'flex' },
                }}
              />

              <Tooltip title={user.userName}>
                <IconButton color="inherit" onClick={openMenu} size="small">
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>

              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{user.userName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={openChangePw}>
                  <LockIcon fontSize="small" sx={{ mr: 1.5 }} /> Change Password
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Sign Out
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Change Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {pwDone ? (
            <Alert severity="success">Password changed successfully!</Alert>
          ) : (
            <>
              {user?.passwordResetRequired && (
                <Alert severity="warning" icon={<WarningAmberIcon />}>
                  An admin has reset your password. Please set a new one.
                </Alert>
              )}
              <TextField
                label="Current Password"
                type={showC ? 'text' : 'password'}
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setPwError(''); }}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowC(v => !v)} edge="end" size="small">
                        {showC ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="New Password"
                type={showN ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
                fullWidth
                helperText="Minimum 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowN(v => !v)} edge="end" size="small">
                        {showN ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {pwError && <Alert severity="error">{pwError}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwOpen(false)} color="inherit">
            {pwDone ? 'Close' : 'Cancel'}
          </Button>
          {!pwDone && (
            <Button variant="contained" onClick={handleChangePw} disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Update Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
