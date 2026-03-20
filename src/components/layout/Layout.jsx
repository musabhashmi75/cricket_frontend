import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Navbar from './Navbar';

export default function Layout({ children, maxWidth = 'lg' }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
