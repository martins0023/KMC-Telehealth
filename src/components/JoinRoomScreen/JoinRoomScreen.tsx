// JoinRoomScreen.tsx
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

interface JoinRoomScreenProps {
  name: string;
  roomName: string;
  consultationDate: string;
  startTime: string;
  endTime: string;
  setName: (name: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function JoinRoomScreen({
  name,
  roomName,
  consultationDate,
  startTime,
  endTime,
  setName,
  handleSubmit,
}: JoinRoomScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();

  // Local state to manage snackbar notifications.
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // When the form is submitted, call the backend validate endpoint
  // and only then proceed if all validations pass.
  const handleJoinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Construct your API base URL
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    try {
      // Call the validate endpoint using the roomName.
      await axios.get(`${API_URL}/api/v1/consultations/${roomName}`);
      // If successful, clear any previous error and invoke the passed handleSubmit (which likely moves to the video chat).
      setSnackbarMessage('Consultation validated successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Proceed to the next step (video join).
      handleSubmit(event);
    } catch (error: any) {
      // On error, display a snackbar notification with the error message.
      const errMsg = error.response?.data?.message || 'Failed to validate consultation.';
      setSnackbarMessage(errMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // We assume the join form is valid if the user’s name is entered and the room name is available.
  const isFormValid = Boolean((user?.displayName || name) && roomName);

  return (
    <>
      <Typography variant="h5" className={classes.gutterBottom}>
        Join Consultation
      </Typography>
      <Typography variant="body1">
        {`Please enter your name to join the consultation.`}
      </Typography>
      <form onSubmit={handleJoinSubmit}>
        <div className={classes.inputContainer}>
          {!user?.displayName && (
            <div className={classes.textFieldContainer}>
              <InputLabel shrink htmlFor="join-user-name">
                Display Name
              </InputLabel>
              <TextField
                id="join-user-name"
                variant="outlined"
                fullWidth
                size="small"
                value={name}
                onChange={handleNameChange}
              />
            </div>
          )}
          <div className={classes.textFieldContainer}>
            <InputLabel shrink htmlFor="join-room-name">
              Room Name
            </InputLabel>
            <TextField
              id="join-room-name"
              variant="outlined"
              fullWidth
              size="small"
              value={roomName}
              InputProps={{ readOnly: true }}
            />
          </div>
        </div>
        <Grid container justifyContent="flex-end">
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={!isFormValid}
            className={classes.continueButton}
          >
            Continue
          </Button>
        </Grid>
      </form>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}