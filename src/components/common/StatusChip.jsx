import React from 'react';
import Chip from '@mui/material/Chip';

// Match status colours
const MATCH_COLOR = {
  UPCOMING:  'info',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

// Payment status colours
const PAYMENT_COLOR = {
  PAID:    'success',
  PENDING: 'error',
};

/**
 * <StatusChip type="match"   value="UPCOMING" />
 * <StatusChip type="payment" value="PAID" />
 * <StatusChip type="payment" value={null} />   → shows "NOT UPLOADED" in warning
 */
export default function StatusChip({ type, value, size = 'small' }) {
  if (type === 'match') {
    return (
      <Chip
        label={value ?? '—'}
        color={MATCH_COLOR[value] ?? 'default'}
        size={size}
        variant="filled"
      />
    );
  }

  if (value == null) {
    return <Chip label="NOT UPLOADED" color="warning" size={size} variant="outlined" />;
  }

  return (
    <Chip
      label={value}
      color={PAYMENT_COLOR[value] ?? 'default'}
      size={size}
      variant="filled"
    />
  );
}
