// LinkGenerationScreen.tsx
import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  Typography,
  makeStyles,
  TextField,
  Grid,
  Button,
  InputLabel,
  Theme,
  Snackbar,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import axios from 'axios';
import { useAppState } from '../../state';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
    margin: '1.5em 0 3.5em',
    [theme.breakpoints.down('sm')]: {
      margin: '1.5em 0 2em',
    },
  },
  gridContainer: {
    marginBottom: '1em',
  },
  textFieldContainer: {
    width: '100%',
  },
  continueButton: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  validationMessage: {
    color: 'red',
    marginTop: '0.5em',
  },
}));

function Alert(props: any) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface LinkGenerationScreenProps {
  name: string;
  roomName: string;
  consultationDate: string; // format: YYYY-MM-DD
  startTime: string;        // format: HH:mm
  endTime: string;          // format: HH:mm
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  setConsultationDate: (date: string) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void; // (Not used internally)
}

/**
 * Helper to parse a date and time string into a local Date.
 */
const parseLocalDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

export default function LinkGenerationScreen({
  name,
  roomName,
  consultationDate,
  startTime,
  endTime,
  setName,
  setRoomName,
  setConsultationDate,
  setStartTime,
  setEndTime,
  handleSubmit,
}: LinkGenerationScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();

  // Local state for showing the generated link, snackbar, and status message.
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState<'green' | 'red'>('green');

  // Input change handlers.
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value);
  const handleRoomNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    setRoomName(e.target.value);
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) =>
    setConsultationDate(e.target.value);
  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    setStartTime(e.target.value);
  const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEndTime(e.target.value);

  // Instead of checking against the current time, we only verify that the start time is before the end time.
  let validationMessage = '';
  let isWithinTimeWindow = true;
  if (consultationDate && startTime && endTime) {
    const scheduledStart = parseLocalDateTime(consultationDate, startTime);
    const scheduledEnd = parseLocalDateTime(consultationDate, endTime);
    if (scheduledStart >= scheduledEnd) {
      validationMessage = 'Start time must be before end time.';
      isWithinTimeWindow = false;
    }
  }

  // Form is valid if all required fields are provided and the time ordering is correct.
  const isFormValid =
    Boolean((user?.displayName || name) && roomName && consultationDate && startTime && endTime) &&
    isWithinTimeWindow;

  // When the form is submitted: call the backend, copy the link, and update status.
  const internalHandleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    // Construct API base URL from environment or fallback.
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    try {
      // Call the backend to create the consultation record.
      const response = await axios.post(`${API_URL}/api/v1/consultations`, {
        name: user?.displayName || name,
        roomName,
        consultationDate,
        startTime,
        endTime,
      });
      // On success, generate the link.
      const link = `${window.location.origin}/room/${roomName}${window.location.search || ''}`;
      // Copy the link to the clipboard.
      await navigator.clipboard.writeText(link);
      setGeneratedLink(link);
      setSnackbarOpen(true);
      setStatusMessage('Consultation created successfully.');
      setStatusColor('green');
    } catch (error: any) {
      console.error("Error creating consultation", error);
      setStatusMessage(error.response?.data?.message || 'Failed to create consultation.');
      setStatusColor('red');
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Schedule Consultation
      </Typography>
      <Typography variant="body1">
        {user?.displayName
          ? 'Set the consultation details below.'
          : 'Enter your name and consultation details to generate the room link.'}
      </Typography>
      <form onSubmit={internalHandleSubmit}>
        <div className={classes.inputContainer}>
          {!user?.displayName && (
            <div className={classes.textFieldContainer}>
              <InputLabel shrink htmlFor="input-user-name">
                Your Name
              </InputLabel>
              <TextField
                id="input-user-name"
                variant="outlined"
                fullWidth
                size="small"
                value={name}
                onChange={handleNameChange}
              />
            </div>
          )}
          <div className={classes.textFieldContainer}>
            <InputLabel shrink htmlFor="input-consultation-date">
              Consultation Date
            </InputLabel>
            <TextField
              id="input-consultation-date"
              variant="outlined"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={consultationDate}
              onChange={handleDateChange}
            />
          </div>
          <Grid container spacing={2} className={classes.gridContainer}>
            <Grid item xs={6}>
              <div className={classes.textFieldContainer}>
                <InputLabel shrink htmlFor="input-start-time">
                  Start Time
                </InputLabel>
                <TextField
                  id="input-start-time"
                  variant="outlined"
                  fullWidth
                  size="small"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={startTime}
                  onChange={handleStartTimeChange}
                />
              </div>
            </Grid>
            <Grid item xs={6}>
              <div className={classes.textFieldContainer}>
                <InputLabel shrink htmlFor="input-end-time">
                  End Time
                </InputLabel>
                <TextField
                  id="input-end-time"
                  variant="outlined"
                  fullWidth
                  size="small"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={endTime}
                  onChange={handleEndTimeChange}
                />
              </div>
            </Grid>
          </Grid>
          <div className={classes.textFieldContainer}>
            <InputLabel shrink htmlFor="input-room-name">
              Room Name
            </InputLabel>
            <TextField
              autoCapitalize="false"
              id="input-room-name"
              variant="outlined"
              fullWidth
              size="small"
              value={roomName}
              onChange={handleRoomNameChange}
            />
          </div>
          {validationMessage && (
            <Typography className={classes.validationMessage}>
              {validationMessage}
            </Typography>
          )}
        </div>
        <Grid container justifyContent="flex-end">
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={!isFormValid}
            className={classes.continueButton}
          >
            Generate Link
          </Button>
        </Grid>
      </form>
      {generatedLink && (
        <Typography
          variant="body2"
          style={{
            marginTop: '1em',
            wordBreak: 'break-all',
            color: 'green',
          }}
        >
          Generated Link: {generatedLink}
        </Typography>
      )}
      <Typography style={{ marginTop: '1em', color: statusColor }}>
        {statusMessage}
      </Typography>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success">
          Link has been copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
}