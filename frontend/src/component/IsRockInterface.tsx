import React, { useRef, useState } from "react";
import { Button, Typography, Box, CircularProgress } from "@mui/material";
import axios from "axios"; // Import Axios

const IsRockInterface: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>("");

    const startCamera = async () => {
        setResult("");
        setIsCameraOn(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error) {
            console.error("Error accessing the camera:", error);
        }
    };

    const stopCamera = () => {
        setIsCameraOn(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const analyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsLoading(true);
        setResult("");

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Convert canvas data to a blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error("Failed to create image blob");
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "frame.jpg");
            console.log(blob);

            try {
                const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
                    headers: {
                        // Don't set Content-Type, let Axios do it automatically
                        Accept: "application/json", // Optional: to ensure the server knows to send JSON back
                    },
                });
                setResult(response.data?.message || "No response message");
            } catch (error) {
                console.error("Error analyzing frame:", error);
                setResult("Error analyzing the image.");
            } finally {
                setIsLoading(false);
            }
        }, "image/jpeg");
    };

    return (
        <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Rock Detector
            </Typography>

            <Box>
                {isCameraOn ? (
                    <>
                        <video ref={videoRef} style={{ width: "100%", maxWidth: "500px" }} />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={analyzeFrame} disabled={isLoading}>
                                {isLoading ? "Analyzing..." : "Check for Rock"}
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={stopCamera}
                                sx={{ ml: 2 }}
                                disabled={isLoading}
                            >
                                Stop Camera
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Button variant="contained" onClick={startCamera}>
                        Open Camera
                    </Button>
                )}
            </Box>

            {isLoading && <CircularProgress sx={{ mt: 2 }} />}
            {result && (
                <Typography
                    variant="h6"
                    sx={{ mt: 2, color: result.toLowerCase().includes("yes") ? "green" : "red" }}
                >
                    {result}
                </Typography>
            )}
        </Box>
    );
};

export default IsRockInterface;
