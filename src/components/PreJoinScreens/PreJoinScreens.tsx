// PreJoinScreens.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import IntroContainer from '../IntroContainer/IntroContainer';
import MediaErrorSnackbar from './MediaErrorSnackbar/MediaErrorSnackbar';
import LinkGenerationScreen from '../LinkGenerationScreen/LinkGenerationScreen';
import JoinRoomScreen from '../JoinRoomScreen/JoinRoomScreen';
import DeviceSelectionScreen from './DeviceSelectionScreen/DeviceSelectionScreen';
import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';

export enum Steps {
  linkGeneration,   // First: scheduling details entered & link generated
  roomJoin,         // Second: User clicks on the generated link—revalidation occurs
  deviceSelection,  // Finally: proceed to video connection (Twilio device selection)
}

export default function PreJoinScreens() {
  const { user } = useAppState();
  const { getAudioAndVideoTracks } = useVideoContext();
  const { URLRoomName } = useParams<{ URLRoomName?: string }>();

  // Shared state for consultation details & user info.
  const [step, setStep] = useState<Steps>(Steps.linkGeneration);
  const [name, setName] = useState<string>(user?.displayName || '');
  const [roomName, setRoomName] = useState<string>('');
  const [consultationDate, setConsultationDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [mediaError, setMediaError] = useState<Error>();

  // If the URL contains a room name (from a generated link), transition to the join screen.
  useEffect(() => {
    if (URLRoomName) {
      setRoomName(URLRoomName);
      setStep(Steps.roomJoin);
    }
  }, [URLRoomName]);

  useEffect(() => {
    if (step === Steps.deviceSelection && !mediaError) {
      getAudioAndVideoTracks().catch((error) => {
        console.error('Error acquiring media:', error);
        setMediaError(error);
      });
    }
  }, [step, mediaError, getAudioAndVideoTracks]);

  // Handler for the link generation screen.
  const handleLinkGeneration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Update the browser URL so the generated link contains the room name.
    if (!window.location.origin.includes('twil.io') && !(window as any).STORYBOOK_ENV) {
      window.history.replaceState(
        null,
        '',
        window.encodeURI(`/room/${roomName}${window.location.search || ''}`)
      );
    }
    // Transition to the join screen (simulate clicking the generated link)
    setStep(Steps.roomJoin);
  };

  // Handler for the join screen.
  const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!window.location.origin.includes('twil.io') && !(window as any).STORYBOOK_ENV) {
      window.history.replaceState(
        null,
        '',
        window.encodeURI(`/room/${roomName}${window.location.search || ''}`)
      );
    }
    setStep(Steps.deviceSelection);
  };

  return (
    <IntroContainer>
      <MediaErrorSnackbar error={mediaError} />
      {step === Steps.linkGeneration && (
        <LinkGenerationScreen
          name={name}
          roomName={roomName}
          consultationDate={consultationDate}
          startTime={startTime}
          endTime={endTime}
          setName={setName}
          setRoomName={setRoomName}
          setConsultationDate={setConsultationDate}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          handleSubmit={handleLinkGeneration}
        />
      )}
      {step === Steps.roomJoin && (
        <JoinRoomScreen
          name={name}
          roomName={roomName}
          consultationDate={consultationDate}
          startTime={startTime}
          endTime={endTime}
          setName={setName}
          handleSubmit={handleJoinSubmit}
        />
      )}
      {step === Steps.deviceSelection && (
        <DeviceSelectionScreen name={name} roomName={roomName} setStep={setStep} />
      )}
    </IntroContainer>
  );
}