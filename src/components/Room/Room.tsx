import React, { useEffect, useState } from 'react';
import BackgroundSelectionDialog from '../BackgroundSelectionDialog/BackgroundSelectionDialog';
import ChatWindow from '../ChatWindow/ChatWindow';
import clsx from 'clsx';
import { GalleryView } from '../GalleryView/GalleryView';
import { MobileGalleryView } from '../MobileGalleryView/MobileGalleryView';
import MainParticipant from '../MainParticipant/MainParticipant';
import { makeStyles, Theme, useMediaQuery, useTheme, Typography, Snackbar } from '@material-ui/core';
import { Participant, Room as IRoom } from 'twilio-video';
import { ParticipantAudioTracks } from '../ParticipantAudioTracks/ParticipantAudioTracks';
import ParticipantList from '../ParticipantList/ParticipantList';
import useChatContext from '../../hooks/useChatContext/useChatContext';
import useScreenShareParticipant from '../../hooks/useScreenShareParticipant/useScreenShareParticipant';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import axios from 'axios';
import MuiAlert from '@material-ui/lab/Alert';
import { useHistory } from 'react-router-dom';
import { useAppState } from '../../state';

function Alert(props: any) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme: Theme) => {
  const totalMobileSidebarHeight = `${theme.sidebarMobileHeight +
    theme.sidebarMobilePadding * 2 +
    theme.participantBorderWidth}px`;
  return {
    container: {
      position: 'relative',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: `1fr ${theme.sidebarWidth}px`,
      gridTemplateRows: '100%',
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '100%',
        gridTemplateRows: `calc(100% - ${totalMobileSidebarHeight}) ${totalMobileSidebarHeight}`,
      },
    },
    countdownText: {
      position: 'absolute',
      top: theme.spacing(1),
      right: theme.spacing(1),
      background: theme.palette.background.paper,
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.shape.borderRadius,
      fontFamily: '"Roboto Mono", monospace',
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      fontSize: '1rem',
      letterSpacing: '0.05em',
    },
    rightDrawerOpen: {
      gridTemplateColumns: `1fr ${theme.sidebarWidth}px ${theme.rightDrawerWidth}px`,
    },
  };
});

/**
 * This hook toggles the speaker view when a participant starts screensharing.
 */
export function useSetSpeakerViewOnScreenShare(
  screenShareParticipant: Participant | undefined,
  room: IRoom | null,
  setIsGalleryViewActive: React.Dispatch<React.SetStateAction<boolean>>,
  isGalleryViewActive: boolean
) {
  const isGalleryViewActiveRef = React.useRef(isGalleryViewActive);
  useEffect(() => {
    isGalleryViewActiveRef.current = isGalleryViewActive;
  }, [isGalleryViewActive]);
  useEffect(() => {
    if (screenShareParticipant && screenShareParticipant !== room!.localParticipant) {
      const prev = isGalleryViewActiveRef.current;
      setIsGalleryViewActive(false);
      return () => {
        if (prev) setIsGalleryViewActive(prev);
      };
    }
  }, [screenShareParticipant, setIsGalleryViewActive, room]);
}

export default function Room() {
  const { isGalleryViewActive, setIsGalleryViewActive } = useAppState();
  const classes = useStyles();
  const { isChatWindowOpen } = useChatContext();
  const { isBackgroundSelectionOpen, room } = useVideoContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const screenShareParticipant = useScreenShareParticipant();
  const history = useHistory();

  // Local state for our backend validations and countdown.
  const [consultationEndTime, setConsultationEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error');

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

  // Apply our custom speaker view hook.
  // (We assume that setIsGalleryViewActive is provided by Twilio's VideoContext or similar)
  useSetSpeakerViewOnScreenShare(screenShareParticipant, room, () => { }, true);

  // For the Snackbar onClose callback, we now provide fully typed parameters and ignore the unused first parameter.
  const handleSnackbarClose = (_event: React.SyntheticEvent, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };



  return (
    <div
      className={clsx(classes.container, {
        [classes.rightDrawerOpen]: isChatWindowOpen || isBackgroundSelectionOpen,
      })}
    >
      {/* The audio tracks always remain mounted. */}
      <ParticipantAudioTracks />

      {/** Twilio’s original UI for room display */}
      {isGalleryViewActive ? (
        isMobile ? (
          <MobileGalleryView />
        ) : (
          <GalleryView />
        )
      ) : (
        <>
          <MainParticipant />
          <ParticipantList />
        </>
      )}

      <ChatWindow />
      <BackgroundSelectionDialog />

      {/* Live countdown overlay */}
      {consultationEndTime && (
        <Typography className={classes.countdownText}>
          Time Remaining: {formatTime(timeRemaining)}
        </Typography>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </div>
  );
}