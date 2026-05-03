import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const PUBLIC_IP = import.meta.env.VITE_PUBLIC_IP;
const socket = io(`https://${PUBLIC_IP}:5000`);

function App() {
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const localVideoRef = useRef();
  const peersRef = useRef({});
  const iceQueueRef = useRef({});
  const localStreamRef = useRef();

  const roomId = "lan-room";

  const createPeer = async (userId, stream, initiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          target: userId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      setPeers((prev) => ({
        ...prev,
        [userId]: e.streams[0],
      }));
    };

    peersRef.current[userId] = pc;

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", {
        target: userId,
        sdp: offer,
      });
    }

    return pc;
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        socket.emit("join-room", roomId);

        socket.on("all-users", async (users) => {
          users = [...new Set(users)];

          for (const userId of users) {
            if (!peersRef.current[userId]) {
              await createPeer(userId, stream, true);
            }
          }
        });

        socket.on("user-joined", async (userId) => {
          if (!peersRef.current[userId]) {
            await createPeer(userId, stream, false);
          }
        });

        socket.on("offer", async ({ sender, sdp }) => {
          let pc = peersRef.current[sender];

          if (!pc) {
            pc = await createPeer(sender, stream, false);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          if (iceQueueRef.current[sender]) {
            for (const candidate of iceQueueRef.current[sender]) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceQueueRef.current[sender] = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answer", {
            target: sender,
            sdp: answer,
          });
        });

        socket.on("answer", async ({ sender, sdp }) => {
          const pc = peersRef.current[sender];
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("ice-candidate", async ({ sender, candidate }) => {
          const pc = peersRef.current[sender];
          if (!pc) return;

          if (!iceQueueRef.current[sender]) {
            iceQueueRef.current[sender] = [];
          }

          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            iceQueueRef.current[sender].push(candidate);
          }
        });

        socket.on("user-left", (userId) => {
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }

          setPeers((prev) => {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          });
        });
      });
  }, []);

  // 🎤 Toggle Mute
  const toggleMute = () => {
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  // 🎥 Toggle Video
  const toggleVideo = () => {
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = videoOff;
    });
    setVideoOff(!videoOff);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>WEBRTC VIDEO CALL</h2>
        <p>Participants: {Object.keys(peers).length + 1}</p>
      </div>

      <div style={styles.videoGrid}>
        {/* Local */}
        <div style={styles.videoCard}>
          <video ref={localVideoRef} autoPlay muted style={styles.video} />
          <span style={styles.label}>You</span>
        </div>

        {/* Remote */}
        {Object.entries(peers).map(([id, stream]) => (
          <div key={id} style={styles.videoCard}>
            <video
              autoPlay
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
              style={styles.video}
            />
            <span style={styles.label}>User {id.slice(0, 5)}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button onClick={toggleMute} style={styles.button}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleVideo} style={styles.button}>
          {videoOff ? "Start Video" : "Stop Video"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: "20px",
    fontFamily: "Arial",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  videoCard: {
    position: "relative",
    borderRadius: "15px",
    overflow: "hidden",
    background: "#1e293b",
  },
  video: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  label: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    background: "rgba(0,0,0,0.6)",
    padding: "5px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  },
  controls: {
    marginTop: "20px",
    textAlign: "center",
  },
  button: {
    margin: "10px",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default App;