import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

const CameraBroadcaster = () => {
  const webcamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [videoNode, setVideoNode] = useState(null);
  
  useEffect(() => {
    // Access the camera
    if (webcamRef.current) {
      setVideoNode(webcamRef.current.video);
      if (videoNode && videoNode.srcObject) {
        setStream(videoNode.srcObject);
      }
    }
  }, [webcamRef]);

  return (
    <div>
      <h1>Broadcasting Camera</h1>
      <Webcam
        audio={true}
        ref={webcamRef}
        width={640}
        height={480}
      />
      {console.log('Current Stream:', videoNode)}
      <p>Share this IP: {window.location.href}</p>
    </div>
  );
};

export default CameraBroadcaster;
