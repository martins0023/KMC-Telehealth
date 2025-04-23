// RoomNameScreen.tsx
import React, { ChangeEvent, FormEvent } from 'react';
import {
  Typography,
  makeStyles,
  TextField,
  Grid,
  Button,
  InputLabel,
  Theme
} from '@material-ui/core';
import { useAppState } from '../../../state';

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

interface RoomNameScreenProps {
  name: string;
  roomName: string;
  consultationDate: string; // expected format: YYYY-MM-DD
  startTime: string; // expected format: HH:mm
  endTime: string; // expected format: HH:mm
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  setConsultationDate: (date: string) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function RoomNameScreen({
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
}: RoomNameScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();

  // Handle input changes:
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value);
  };
  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConsultationDate(event.target.value);
  };
  const handleStartTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStartTime(event.target.value);
  };
  const handleEndTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value);
  };

  // Determine if the user already has a display name
  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  // Client‑side validation: using the selected consultation date, start time, and end time,
  // check if the current time falls within the consultation window.
  let validationMessage = '';
  let isWithinTimeWindow = false;
  if (consultationDate && startTime && endTime) {
    // Create Date objects assuming the provided date and time are in proper ISO format.
    const scheduledStart = new Date(`${consultationDate}T${startTime}`);
    const scheduledEnd = new Date(`${consultationDate}T${endTime}`);
    const now = new Date();

    if (now < scheduledStart) {
      validationMessage = 'Consultation has not started yet.';
    } else if (now > scheduledEnd) {
      validationMessage = 'Consultation time has expired.';
    } else {
      isWithinTimeWindow = true;
    }
  }

  // The form is considered valid if all required inputs are provided and the current time
  // is within the consultation window.
  const isFormValid =
    Boolean((hasUsername || name) && roomName && consultationDate && startTime && endTime) &&
    isWithinTimeWindow;

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Generate Consultation Link
      </Typography>
      <Typography variant="body1">
        {hasUsername
          ? "Enter the consultation details below to generate the meeting link."
          : "Enter your name and consultation details to generate the meeting link."}
      </Typography>
      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          {!hasUsername && (
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
    </>
  );
}