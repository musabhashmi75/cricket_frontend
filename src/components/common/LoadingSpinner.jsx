import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}
