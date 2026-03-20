import React, { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import GroupsIcon from '@mui/icons-material/Groups';
import Layout from '../components/layout/Layout';
import StatusChip from '../components/common/StatusChip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { matchApi } from '../api/matchApi';
import { paymentApi } from '../api/paymentApi';
import { useAuth } from '../context/AuthContext';

// Converts an absolute backend URL (http://103.x.x.x/uploads/...) to a relative
// path (/uploads/...) so it flows through Vercel's proxy rewrite over HTTPS.
function toProxiedUrl(url) {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export default function MatchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [match, setMatch]       = useState(null);
  const [players, setPlayers]   = useState([]);
  const [payments, setPayments] = useState({});   // userId → payment
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Guests have no auth token — skip the payment API call (requires auth)
      const requests = [matchApi.getOne(id), matchApi.getPlayers(id)];
      if (user) requests.push(paymentApi.getByMatch(id));

      const [matchData, playersData, paymentsData] = await Promise.all(requests);
      setMatch(matchData);
      setPlayers(playersData);
      if (paymentsData) {
        const payMap = {};
        paymentsData.forEach(p => { payMap[p.userId] = p; });
        setPayments(payMap);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const handleUploadSuccess = (payment) => {
    setPayments(prev => ({ ...prev, [payment.userId]: payment }));
  };

  const amIPlayer   = user && players.some(p => p.userId === user.userId);
  const myPayment   = user ? payments[user.userId] : null;
  const paidCount   = Object.values(payments).filter(p => p.status === 'PAID').length;
  const unpaidCount = players.length - paidCount;

  // Sort: guests last, then unpaid registered, then paid
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.guest && !b.guest) return 1;
    if (!a.guest && b.guest) return -1;
    const aPaid = payments[a.userId]?.status === 'PAID';
    const bPaid = payments[b.userId]?.status === 'PAID';
    return Number(aPaid) - Number(bPaid);
  });

  if (loading) return <Layout><LoadingSpinner message="Loading match details…" /></Layout>;
  if (error)   return <Layout><ErrorAlert message={error} onRetry={load} /></Layout>;
  if (!match)  return null;

  return (
    <Layout>
      {/* Back button + title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/matches')} size="small"><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
          Match Details
        </Typography>
        <StatusChip type="match" value={match.status} />
        <Chip
          size="small"
          icon={match.visibility === 'PRIVATE' ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <PublicIcon sx={{ fontSize: '14px !important' }} />}
          label={match.visibility === 'PRIVATE' ? 'Private' : 'Public'}
          color={match.visibility === 'PRIVATE' ? 'default' : 'info'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* ── Match Info ── */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h5">{match.groundName}</Typography>
              {match.groundLocation && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  📍 {match.groundLocation}
                </Typography>
              )}
              {match.teamName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupsIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{match.teamName}</Typography>
                </Box>
              )}
              <Divider />
              <InfoGrid items={[
                { label: 'Date & Time',   value: dayjs(match.dateTime).format('D MMM YYYY, h:mm A') },
                { label: 'Total Amount',  value: `₹${Number(match.totalAmount).toLocaleString()}` },
                { label: 'Per Person',    value: match.perPersonAmount > 0 ? `₹${Number(match.perPersonAmount).toLocaleString()}` : '—' },
                { label: 'Players',       value: players.length },
                { label: 'Paid',          value: paidCount },
                { label: 'Unpaid',        value: unpaidCount },
              ]} />
              {match.description && (
                <>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">{match.description}</Typography>
                </>
              )}

              {/* Payment action for current player */}
              {!isAdmin && amIPlayer && (
                <>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">My Payment</Typography>
                      <StatusChip type="payment" value={myPayment?.status ?? null} />
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => setUploadOpen(true)}
                      color={myPayment?.status === 'PAID' ? 'success' : 'primary'}
                      size="small"
                    >
                      {myPayment?.status === 'PAID' ? 'Re-upload' : 'Upload Proof'}
                    </Button>
                  </Box>
                  {myPayment?.fileUrl && (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<ImageIcon />}
                      onClick={() => setPreviewUrl(toProxiedUrl(myPayment.fileUrl))}
                    >
                      View uploaded proof
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Players & Payments ── */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Players &amp; Payment Status
              </Typography>

              {players.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No players have joined yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><b>Player</b></TableCell>
                        <TableCell><b>Status</b></TableCell>
                        <TableCell align="right"><b>Proof</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedPlayers.map(player => {
                        const payment = payments[player.userId];
                        const isPaid  = payment?.status === 'PAID';
                        return (
                          <TableRow
                            key={player.id}
                            sx={{
                              bgcolor: player.guest
                                ? 'grey.50'
                                : isPaid ? 'success.50' : 'error.50',
                              '&:hover': { filter: 'brightness(0.97)' },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {player.userName}
                                {player.guest && (
                                  <Chip label="Guest" size="small" color="default" variant="outlined"
                                    sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                )}
                                {!player.guest && user && player.userId === user.userId && (
                                  <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary"
                                sx={{ display: { xs: 'none', sm: 'block' } }}>
                                {player.guest ? player.guestContact : player.userEmail}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {player.guest
                                ? <Chip label="—" size="small" variant="outlined" />
                                : <StatusChip type="payment" value={payment?.status ?? null} />
                              }
                            </TableCell>
                            <TableCell align="right">
                              {!player.guest && payment?.fileUrl ? (
                                <Tooltip title="View proof">
                                  <IconButton
                                    size="small"
                                    onClick={() => setPreviewUrl(toProxiedUrl(payment.fileUrl))}
                                  >
                                    <ImageIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        matchId={match.id}
        userId={user.userId}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </Layout>
  );
}

// ─── Image Preview Dialog ───────────────────────────────────────────────────
function ImagePreviewDialog({ url, onClose }) {
  if (!url) return null;
  const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
  return (
    <Dialog open={!!url} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Payment Proof
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
        {isPdf ? (
          <iframe
            src={url}
            title="Payment proof"
            width="100%"
            height="520px"
            style={{ border: 'none' }}
          />
        ) : (
          <img
            src={url}
            alt="Payment proof"
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button href={url} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />} size="small">
          Open in new tab
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Info Grid ─────────────────────────────────────────────────────────────
function InfoGrid({ items }) {
  return (
    <Grid container spacing={1.5}>
      {items.map(({ label, value }) => (
        <Grid item xs={6} key={label}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="body1" fontWeight={500}>{value}</Typography>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── Upload Dialog ──────────────────────────────────────────────────────────
function UploadDialog({ open, matchId, userId, onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [file, setFile]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [done, setDone]       = useState(false);

  const reset = () => { setFile(null); setUploadError(''); setDone(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setUploadError('Only JPG, PNG, GIF, WebP, or PDF files are accepted.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('File must not exceed 5 MB.');
      return;
    }
    setUploadError('');
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await paymentApi.upload(matchId, userId, file);
      setDone(true);
      onSuccess(result);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Upload Payment Proof</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {uploading && <LinearProgress />}

        {done ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
            <Typography variant="h6" mt={1}>Uploaded Successfully!</Typography>
            <Typography variant="body2" color="text.secondary">
              Your payment has been marked as PAID.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Upload a screenshot or PDF of your payment receipt.
              Accepted formats: JPG, PNG, GIF, WebP, PDF — max 5 MB.
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: file ? 'success.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: file ? 'success.50' : 'grey.50',
                transition: 'all 0.2s',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 40, color: file ? 'success.main' : 'grey.400' }} />
              <Typography variant="body2" mt={1}>
                {file ? file.name : 'Click to choose a file'}
              </Typography>
              {file && (
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              )}
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileChange}
              />
            </Box>

            {uploadError && <Alert severity="error">{uploadError}</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {done ? 'Close' : 'Cancel'}
        </Button>
        {!done && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={<CloudUploadIcon />}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
