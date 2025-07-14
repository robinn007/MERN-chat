import React, { useEffect, useRef, useState } from 'react';
import socket from '@/socket'; 
import { Button } from '@/components/ui/button';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

const VideoCall = ({ socketId, onCallEnd }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);

  useEffect(() => {
    startCall();
    return () => {
      cleanup();
    };
  }, [socketId]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      createPeerConnection();

      if (peerConnection.current) {
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });
      }

      if (socketId) {
        const offer = await peerConnection.current?.createOffer();
        if (offer) {
          await peerConnection.current.setLocalDescription(offer);
          socket.emit('user:call', { to: socketId, offer });
        }
      }

      peerConnection.current?.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: socketId, candidate: event.candidate });
        }
      });

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.current.addEventListener('track', (event) => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    });
  };

  const handleIncomingCall = async ({ from, offer }) => {
    try {
      if (!peerConnection.current) {
        createPeerConnection();
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream);
        });
      }

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.current.createAnswer();
      if (answer) {
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('accept:call', { to: from, answer });
      }

      peerConnection.current.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: from, candidate: event.candidate });
        }
      });
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  useEffect(() => {
    socket.on('incoming:call', handleIncomingCall);

    socket.on('call:accepted', async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding received ICE candidate', error);
      }
    });

    socket.on('call:ended', () => {
      endCall();
    });

    return () => {
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted');
      socket.off('ice-candidate');
      socket.off('call:ended');
    };
  }, []);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  const endCall = () => {
    cleanup();
    socket.emit('call:end', { to: socketId });
    onCallEnd();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startScreenShare = async () => {
    if (!localStream) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(screenTrack);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current && localStream) {
      const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(localStream.getVideoTracks()[0]);

      screenTrackRef.current.stop();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-5">
      <div className="w-full px-5 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '85vh', backgroundColor: 'black' }}
        ></video>
        <div className="absolute bottom-5 right-10 h-48 w-48 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%' }}
          ></video>
        </div>
      </div>
      <div className="flex gap-5 mt-5">
        <Button
          className="bg-red-500 px-4 py-2 rounded-full text-white"
          onClick={endCall}
        >
          <CallEndIcon />
        </Button>
        <Button
          className={`${isVideoEnabled ? 'bg-gray-500' : 'bg-red-500'} px-4 py-2 rounded-full text-white`}
          onClick={toggleVideo}
        >
          <VideocamOffIcon />
        </Button>
        <Button
          className={`${isAudioEnabled ? 'bg-gray-500' : 'bg-red-500'} px-4 py-2 rounded-full text-white`}
          onClick={toggleAudio}
        >
          <MicOffIcon />
        </Button>
        <Button
          className={`${isScreenSharing ? 'bg-red-500' : 'bg-gray-500'} px-4 py-2 rounded-full text-white`}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
