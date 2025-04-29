import React, { useEffect, useState } from 'react';
import {
  Box,
  makeStyles,
  Typography,
  Grid,
  Button,
  Theme,
  Hidden,
  Switch,
  Tooltip,
  Divider,
  Snackbar,
  FormControlLabel,
} from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
// import clsx from 'clsx';
import LocalVideoPreview from './LocalVideoPreview/LocalVideoPreview';
import SettingsMenu from './SettingsMenu/SettingsMenu';
import { Steps } from '../PreJoinScreens';
import ToggleAudioButton from '../../Buttons/ToggleAudioButton/ToggleAudioButton';
import ToggleVideoButton from '../../Buttons/ToggleVideoButton/ToggleVideoButton';
import { useAppState } from '../../../state';
import useChatContext from '../../../hooks/useChatContext/useChatContext';
import useVideoContext from '../../../hooks/useVideoContext/useVideoContext';
import { useKrispToggle } from '../../../hooks/useKrispToggle/useKrispToggle';
import SmallCheckIcon from '../../../icons/SmallCheckIcon';
import InfoIconOutlined from '../../../icons/InfoIconOutlined';
import axios from 'axios';
import MuiAlert from '@material-ui/lab/Alert';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  marginTop: {
    marginTop: '1em',
  },
  deviceButton: {
    width: '100%',
    border: '2px solid #aaa',
    margin: '1em 0',
  },
  localPreviewContainer: {
    paddingRight: '2em',
    marginBottom: '2em',
    [theme.breakpoints.down('sm')]: {
      padding: '0 2.5em',
    },
  },
  joinButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
      width: '100%',
      '& button': {
        margin: '0.5em 0',
      },
    },
  },
  mobileButtonBar: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '1.5em 0 1em',
    },
  },
  mobileButton: {
    padding: '0.8em 0',
    margin: 0,
  },
  toolTipContainer: {
    display: 'flex',
    alignItems: 'center',
    '& div': {
      display: 'flex',
      alignItems: 'center',
    },
    '& svg': {
      marginLeft: '0.3em',
    },
  },
  countdownText: {
    fontFamily: '"Roboto Mono", monospace',
    // marginTop: theme.spacing(1),
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: '1rem',
    letterSpacing: '0.05em',
    // color: theme.palette.common.white,
  },
  countdownBox: {
    display: 'flex',
    alignItems: 'center',        // vertically center icon + text
    justifyContent: 'center',    // center them horizontally as a unit
    marginBottom: theme.spacing(2), // spacing below the timer
    padding: theme.spacing(0.5, 1), // optional: tighten up the padding
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    marginTop: theme.spacing(1),
  },
  timerIcon: {
    fontSize: '1.2rem',
    marginRight: theme.spacing(1),
    // verticalAlign isn't needed when using flex+alignItems, 
    // but you could add it if you still see a pixel offset:
    // verticalAlign: 'middle',
    color: theme.palette.common.white,
  },
}));

// Alert component for snackbars.
function Alert(props: any) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface DeviceSelectionScreenProps {
  name: string;
  roomName: string;
  setStep: (step: Steps) => void;
}

export default function DeviceSelectionScreen({ name, roomName, setStep }: DeviceSelectionScreenProps) {
  const classes = useStyles();
  const {
    getToken,
    isFetching,
    isKrispEnabled,
    isKrispInstalled,
  } = useAppState();
  const { connect: chatConnect } = useChatContext();
  const { connect: videoConnect, isAcquiringLocalTracks, isConnecting } = useVideoContext();
  const { toggleKrisp } = useKrispToggle();
  const disableButtons = isFetching || isAcquiringLocalTracks || isConnecting;

  // Local state for backend validation and countdown.
  const [consultationEndTime, setConsultationEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // When this screen mounts, fetch the consultation record from your backend.
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://doctorkays-backend-1.onrender.com';
    async function fetchConsultation() {
      try {
        const response = await axios.get(`${API_URL}/api/v1/consultations/${roomName}`);
        const { endTime } = response.data; // assuming endTime is returned as an ISO string.
        const end = new Date(endTime);
        setConsultationEndTime(end);
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

  // Setup a countdown timer using the fetched consultationEndTime.
  useEffect(() => {
    if (!consultationEndTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = consultationEndTime.getTime() - now.getTime();
      setTimeRemaining(diff);
      // If time expired, disable join.
      if (diff <= 0) {
        setSnackbarMessage('Consultation has expired.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [consultationEndTime]);

  // Helper: Format time in mm:ss.
  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // New handleJoinSubmit function that calls the backend validation endpoint (again) before proceeding.
  const handleJoinSubmit = async () => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://doctorkays-backend-1.onrender.com';
    try {
      await axios.get(`${API_URL}/api/v1/consultations/${roomName}`);
      // If validation passes, get token and connect.
      getToken(name, roomName).then(({ token }) => {
        videoConnect(token);
        if (process.env.REACT_APP_DISABLE_TWILIO_CONVERSATIONS !== 'true') {
          chatConnect(token);
        }
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to validate consultation.';
      setSnackbarMessage(errMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (isFetching || isConnecting) {
    return (
      <Grid container justifyContent="center" alignItems="center" direction="column" style={{ height: '100%' }}>
        <div>
          <CircularProgress variant="indeterminate" />
        </div>
        <div>
          <Typography variant="body2" style={{ fontWeight: 'bold', fontSize: '16px' }}>
            Joining Consultation
          </Typography>
        </div>
      </Grid>
    );
  }

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join {roomName} <span style={{ fontWeight: 'semibold' }}>consultation room</span>
      </Typography>
      {consultationEndTime && (
        <Box 
        className={classes.countdownBox}>
        <AccessTimeIcon className={classes.timerIcon} />
        <Typography className={classes.countdownText}>
          Time Remaining: {formatTime(timeRemaining)}
        </Typography>
      </Box>
      )}

      <Grid container justifyContent="center">
        <Grid item md={7} sm={12} xs={12}>
          <div className={classes.localPreviewContainer}>
            <LocalVideoPreview identity={name} />
          </div>
          <div className={classes.mobileButtonBar}>
            <Hidden mdUp>
              <ToggleAudioButton className={classes.mobileButton} disabled={disableButtons} />
              <ToggleVideoButton className={classes.mobileButton} disabled={disableButtons} />
              <SettingsMenu mobileButtonClass={classes.mobileButton} />
            </Hidden>
          </div>
        </Grid>
        <Grid item md={5} sm={12} xs={12}>
          <Grid container direction="column" justifyContent="space-between" style={{ alignItems: 'normal' }}>
            <div>
              <Hidden smDown>
                <ToggleAudioButton className={classes.deviceButton} disabled={disableButtons} />
                <ToggleVideoButton className={classes.deviceButton} disabled={disableButtons} />
              </Hidden>
            </div>
          </Grid>
        </Grid>

        <Grid item md={12} sm={12} xs={12}>
          {isKrispInstalled && (
            <Grid container direction="row" justifyContent="space-between" alignItems="center" style={{ marginBottom: '1em' }}>
              <div className={classes.toolTipContainer}>
                <Typography variant="subtitle2">Noise Cancellation</Typography>
                <Tooltip
                  title="Suppress background noise from your microphone"
                  interactive
                  leaveDelay={250}
                  leaveTouchDelay={15000}
                  enterTouchDelay={0}
                >
                  <div>
                    <InfoIconOutlined />
                  </div>
                </Tooltip>
              </div>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!isKrispEnabled}
                    checkedIcon={<SmallCheckIcon />}
                    disableRipple={true}
                    onClick={toggleKrisp}
                  />
                }
                label={isKrispEnabled ? 'Enabled' : 'Disabled'}
                style={{ marginRight: 0 }}
                disabled={isKrispEnabled && isAcquiringLocalTracks}
              />
            </Grid>
          )}
          <Divider />
        </Grid>

        <Grid item md={12} sm={12} xs={12}>
          <Grid container direction="row" alignItems="center" style={{ marginTop: '1em' }}>
            <Hidden smDown>
              <Grid item md={7} sm={12} xs={12}>
                <SettingsMenu mobileButtonClass={classes.mobileButton} />
              </Grid>
            </Hidden>
            <Grid item md={5} sm={12} xs={12}>
              <div className={classes.joinButtons}>
                <Button variant="outlined" color="primary" onClick={() => setStep(Steps.linkGeneration)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  data-cy-join-now
                  onClick={handleJoinSubmit}
                  disabled={disableButtons || (consultationEndTime ? timeRemaining <= 0 : false)}
                >
                  Join Now
                </Button>
              </div>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}