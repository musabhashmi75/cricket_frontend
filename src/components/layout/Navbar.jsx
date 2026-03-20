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
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
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
import MenuIcon from '@mui/icons-material/Menu';
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

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Change password dialog
  const [pwOpen,    setPwOpen]    = useState(false);
  const [current,   setCurrent]   = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showC,     setShowC]     = useState(false);
  const [showN,     setShowN]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwDone,    setPwDone]    = useState(false);

  const openChangePw = () => {
    closeMenu();
    setDrawerOpen(false);
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

  const handleLogout = () => { closeMenu(); setDrawerOpen(false); logout(); navigate('/login'); };

  const navItems = [
    { label: 'Matches',   path: '/matches' },
    { label: 'Teams',     path: '/teams' },
    { label: 'Dashboard', path: '/dashboard' },
    ...(isAdmin ? [{ label: 'Users', path: '/admin/users' }] : []),
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>

          {/* Mobile hamburger */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <SportsCricketIcon sx={{ mr: 0.5, display: { xs: 'none', sm: 'block' } }} />
          <Typography
            variant="h6"
            sx={{ flexGrow: { xs: 1, md: 0 }, cursor: 'pointer', mr: { md: 3 }, fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' } }}
            onClick={() => navigate('/matches')}
          >
            Cricket Manager
          </Typography>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {navItems.map(({ label, path }) => (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={{
                  fontWeight: isActive(path) ? 700 : 400,
                  borderBottom: isActive(path) ? '2px solid white' : '2px solid transparent',
                  borderRadius: 0,
                  pb: '6px',
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

          {/* Right side: role chip + user icon */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              {user.passwordResetRequired && (
                <Tooltip title="Please change your password">
                  <IconButton color="inherit" size="small" onClick={openChangePw}>
                    <WarningAmberIcon color="warning" fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Chip
                label={user.role}
                size="small"
                sx={{
                  bgcolor: user.role === 'ADMIN' ? 'warning.main' : 'success.main',
                  color: 'white', fontWeight: 700,
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

      {/* ── Mobile Drawer ───────────────────────────────────────────────────── */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 240 } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.main', color: 'white' }}>
          <SportsCricketIcon />
          <Typography variant="h6" fontWeight={700}>Cricket Manager</Typography>
        </Box>
        <Divider />

        {user && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>{user.userName}</Typography>
            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            <Chip
              label={user.role} size="small"
              sx={{ mt: 0.5, display: 'block', width: 'fit-content',
                bgcolor: user.role === 'ADMIN' ? 'warning.main' : 'success.main',
                color: 'white', fontWeight: 700 }}
            />
          </Box>
        )}
        <Divider />

        <List dense>
          {navItems.map(({ label, path }) => (
            <ListItemButton
              key={path}
              selected={isActive(path)}
              onClick={() => { navigate(path); setDrawerOpen(false); }}
              sx={{ borderRadius: 1, mx: 1, my: 0.25 }}
            >
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: isActive(path) ? 700 : 400 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List dense>
          <ListItemButton onClick={openChangePw} sx={{ borderRadius: 1, mx: 1, my: 0.25 }}>
            <LockIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
            <ListItemText primary="Change Password" />
          </ListItemButton>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, mx: 1, my: 0.25, color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            <ListItemText primary="Sign Out" primaryTypographyProps={{ color: 'error.main' }} />
          </ListItemButton>
        </List>
      </Drawer>

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
