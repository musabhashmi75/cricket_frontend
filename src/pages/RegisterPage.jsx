import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', phoneNumber: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #1565c0 0%, #0288d1 100%)',
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 1 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SportsCricketIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>Create Account</Typography>
            <Typography variant="body2" color="text.secondary">
              You'll be registered as a Player
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Full Name"    value={form.name}        onChange={set('name')}        required fullWidth />
            <TextField label="Email"        value={form.email}       onChange={set('email')}       required fullWidth type="email" />
            <TextField label="Phone Number" value={form.phoneNumber} onChange={set('phoneNumber')} required fullWidth type="tel"
              placeholder="e.g. +923001234567"
              helperText="7–15 digits, optional leading +"
            />
            <TextField
              label="Password"
              value={form.password}
              onChange={set('password')}
              required
              fullWidth
              type={showPw ? 'text' : 'password'}
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

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </Button>
            <Button variant="text" onClick={() => navigate('/login')}>
              Already have an account? Sign in
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
