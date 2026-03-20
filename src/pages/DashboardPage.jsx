import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import Layout from '../components/layout/Layout';
import StatusChip from '../components/common/StatusChip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = isAdmin
        ? await dashboardApi.admin()
        : await dashboardApi.player(user.userId);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user.userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {isAdmin ? 'Full overview' : `Welcome, ${user.userName}`}
        </Typography>
      </Box>

      <ErrorAlert message={error} onRetry={load} />

      {loading ? (
        <LoadingSpinner message="Loading dashboard…" />
      ) : data ? (
        isAdmin ? <AdminView data={data} /> : <PlayerView data={data} />
      ) : null}
    </Layout>
  );
}

// ─── Admin View ───────────────────────────────────────────────────────────────
function AdminView({ data }) {
  const navigate = useNavigate();
  const statCards = [
    { label: 'Total',     value: data.totalMatches,   icon: <SportsCricketIcon />,     color: 'primary' },
    { label: 'Upcoming',  value: data.upcomingCount,  icon: <EventNoteIcon />,          color: 'info' },
    { label: 'Completed', value: data.completedCount, icon: <CheckCircleOutlineIcon />, color: 'success' },
    { label: 'Cancelled', value: data.cancelledCount, icon: <PendingActionsIcon />,     color: 'error' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={1.5}>
        {statCards.map(({ label, value, icon, color }) => (
          <Grid item xs={6} md={3} key={label}>
            <StatCard label={label} value={value} icon={icon} color={color} />
          </Grid>
        ))}
      </Grid>

      <Box>
        <Typography variant="h6" gutterBottom>Match Breakdown</Typography>
        {data.matches.length === 0 ? (
          <Typography color="text.secondary">No matches yet.</Typography>
        ) : (
          data.matches.map(match => (
            <Accordion key={match.matchId} sx={{ mb: 1, borderRadius: '10px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: 1, flexWrap: 'wrap' }}>
                  <StatusChip type="match" value={match.status} />
                  <Typography fontWeight={600} sx={{ flex: 1, minWidth: 0 }} noWrap>{match.groundName}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {dayjs(match.dateTime).format('D MMM YYYY')}
                    </Typography>
                    <CountBadge label="Players" value={match.playerCount}        color="default" />
                    <CountBadge label="Paid"    value={match.paidCount}          color="success.main" />
                    <CountBadge label="Unpaid"  value={match.unpaidPlayerCount}  color="error.main" />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: { xs: 1, sm: 2 } }}>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <MetricBox label="Total Amount" value={`₹${Number(match.totalAmount).toLocaleString()}`} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MetricBox
                      label="Per Person"
                      value={match.perPersonAmount > 0 ? `₹${Number(match.perPersonAmount).toLocaleString()}` : '—'}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MetricBox
                      label="Pending"
                      value={match.totalPendingAmount > 0 ? `₹${Number(match.totalPendingAmount).toLocaleString()}` : '—'}
                      highlight={match.totalPendingAmount > 0}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button variant="outlined" size="small" fullWidth sx={{ height: '100%', minHeight: 52 }}
                      onClick={() => navigate(`/matches/${match.matchId}`)}>
                      View Details
                    </Button>
                  </Grid>
                </Grid>

                {match.players?.length > 0 && (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><b>Player</b></TableCell>
                          <TableCell><b>Payment</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {match.players.map(p => (
                          <TableRow key={p.userId} sx={{ bgcolor: p.highlighted ? 'error.50' : 'success.50' }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: p.highlighted ? 'error.main' : 'success.main' }}>
                                  {p.userName?.[0]?.toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>{p.userName}</Typography>
                                  <Typography variant="caption" color="text.secondary"
                                    sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    {p.userEmail}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <StatusChip type="payment" value={p.paymentStatus} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Box>
  );
}

// ─── Player View ──────────────────────────────────────────────────────────────
function PlayerView({ data }) {
  const navigate = useNavigate();

  const statCards = [
    { label: 'Joined',      value: data.totalMatchesJoined, icon: <SportsCricketIcon />,     color: 'primary' },
    { label: 'Paid',        value: data.paidCount,          icon: <CheckCircleOutlineIcon />, color: 'success' },
    { label: 'Pending',     value: data.pendingCount,       icon: <PendingActionsIcon />,     color: 'error' },
    { label: 'Not Uploaded',value: data.notUploadedCount,   icon: <MonetizationOnIcon />,     color: 'warning' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={1.5}>
        {statCards.map(({ label, value, icon, color }) => (
          <Grid item xs={6} md={3} key={label}>
            <StatCard label={label} value={value} icon={icon} color={color} />
          </Grid>
        ))}
      </Grid>

      <Box>
        <Typography variant="h6" gutterBottom>My Matches</Typography>
        {data.matches.length === 0 ? (
          <Typography color="text.secondary">You haven't joined any matches yet.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.matches.map(m => (
              <Card
                key={m.matchId}
                variant="outlined"
                sx={{ bgcolor: m.highlighted ? 'error.50' : 'inherit', cursor: 'pointer',
                      '&:hover': { filter: 'brightness(0.97)' } }}
                onClick={() => navigate(`/matches/${m.matchId}`)}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{m.groundName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(m.dateTime).format('D MMM YYYY, h:mm A')}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" sx={{ flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); navigate(`/matches/${m.matchId}`); }}>
                      View
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusChip type="match" value={m.matchStatus} />
                    <StatusChip type="payment" value={m.paymentStatus} />
                    {m.contributionAmount > 0 && (
                      <Chip
                        label={`My share: ₹${Number(m.contributionAmount).toLocaleString()}`}
                        size="small" variant="outlined" color="primary"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 } }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function CountBadge({ label, value, color }) {
  return (
    <Tooltip title={label}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>{label}</Typography>
      </Box>
    </Tooltip>
  );
}

function MetricBox({ label, value, highlight }) {
  return (
    <Box sx={{ bgcolor: highlight ? 'error.50' : 'grey.50', borderRadius: 2, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} color={highlight ? 'error.main' : 'text.primary'}>
        {value}
      </Typography>
    </Box>
  );
}
