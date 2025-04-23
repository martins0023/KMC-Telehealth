import { Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import EndCallButton from '../Buttons/EndCallButton/EndCallButton';
import Menu from '../MenuBar/Menu/Menu';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    background: 'white',
    paddingLeft: '1em',
    display: 'none',
    height: `${theme.mobileTopBarHeight}px`,
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
    },
  },
  countdownText: {
    position: 'relative',
    background: theme.palette.background.paper,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontFamily: '"Roboto Mono", monospace',
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    fontSize: '1rem',
    letterSpacing: '0.05em',
  },
  endCallButton: {
    height: '28px',
    fontSize: '0.85rem',
    padding: '0 0.6em',
  },
  settingsButton: {
    [theme.breakpoints.down('sm')]: {
      height: '28px',
      minWidth: '28px',
      border: '1px solid rgb(136, 140, 142)',
      padding: 0,
      margin: '0 1em',
    },
  },
}));

export default function MobileTopMenuBar() {
  const classes = useStyles();
  const { room } = useVideoContext();

  // Local state for our backend validations and countdown.
  const [consultationEndTime, setConsultationEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error');
  const history = useHistory();

  // Extract the roomName from the video room.
  const roomName = room?.name || '';

  // Fetch consultation details from our backend.
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    async function fetchConsultation() {
      try {
        const response = await axios.get(`${API_URL}/api/v1/consultations/${roomName}`);
        // Expecting the backend to return an ISO string for endTime.
        const { endTime } = response.data;
        const end = new Date(endTime);
        setConsultationEndTime(end);
        setSnackbarMessage(''); // clear previous error
      } catch (error: any) {
        const errMsg = error.response?.data?.message || 'Failed to fetch consultation details.';
        setSnackbarMessage(errMsg);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    if (roomName) {
      fetchConsultation();
    }
  }, [roomName]);

  // Set up a live countdown timer using the fetched consultationEndTime.
  useEffect(() => {
    if (!consultationEndTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = consultationEndTime.getTime() - now.getTime();
      setTimeRemaining(diff);
      // If the remaining time has expired, show error and redirect.
      if (diff <= 0) {
        setSnackbarMessage('Consultation has expired.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        //disconnect twillio
        room?.disconnect();
        clearInterval(interval);
        // then redirect after 3 seconds (3000 ms)
        setTimeout(() => {
          history.push('/');
        }, 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [consultationEndTime, history, room]);

  // Periodically revalidate the consultation (every 30 seconds).
  useEffect(() => {
    if (roomName) {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const interval = setInterval(async () => {
        try {
          await axios.get(`${API_URL}/api/v1/consultations/${roomName}`);
          setSnackbarMessage('');
        } catch (error: any) {
          const errMsg =
            error.response?.data?.message || 'Consultation validation error.';
          setSnackbarMessage(errMsg);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          //disconnect twillio
          room?.disconnect();
          clearInterval(interval);
          // then redirect after 3 seconds (3000 ms)
          setTimeout(() => {
            history.push('/');
          }, 3000);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomName, history]);

  // Helper to format time remaining in mm:ss.
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  return (
    <Grid container alignItems="center" justifyContent="space-between" className={classes.container}>
      <div>
        <Typography variant="subtitle1">{room!.name}</Typography>
      </div>
      {/* Live countdown overlay */}
      <div>
        {consultationEndTime && (
          <Typography className={classes.countdownText}>
             {formatTime(timeRemaining)}
          </Typography>
        )}
      </div>
      <div>
        <EndCallButton className={classes.endCallButton} />
        <Menu buttonClassName={classes.settingsButton} />
      </div>
    </Grid>
  );
}
