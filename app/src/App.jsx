import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const PUBLIC_IP = import.meta.env.VITE_PUBLIC_IP;

const socket = io(`https://${PUBLIC_IP}:5000`);

function App() {
  const [peers, setPeers] = useState({});
  const localVideoRef = useRef();
  const peersRef = useRef({});
  const iceQueueRef = useRef({});
  const roomId = "lan-room";

  const createPeer = async (userId, stream, initiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
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

          await pc.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );

          // Apply queued ICE candidates
          if (iceQueueRef.current[sender]) {
            for (const candidate of iceQueueRef.current[sender]) {
              await pc.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
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

          await pc.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
        });

        socket.on("ice-candidate", async ({ sender, candidate }) => {
          const pc = peersRef.current[sender];
          if (!pc) return;

          if (!iceQueueRef.current[sender]) {
            iceQueueRef.current[sender] = [];
          }

          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
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

  return (
    <div>
      <h2>Zoooooooooooooooooooooooooooom</h2>
      <h3>No of Peers: {Object.keys(peers).length}</h3>

      <video
        ref={localVideoRef}
        autoPlay
        muted
        style={{ width: "300px", margin: "10px" }}
      />

      {Object.entries(peers).map(([id, stream]) => (
        <video
          key={id}
          autoPlay
          ref={(video) => {
            if (video) video.srcObject = stream;
          }}
          style={{
            width: "300px",
            height: "200px",
            margin: "10px",
          }}
        />
      ))}
    </div>
  );
}

export default App;