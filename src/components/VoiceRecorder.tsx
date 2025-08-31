import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, Pause, Download, Trash2, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
}

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  name: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasPermission(false);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await requestMicrophonePermission();
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const recording: Recording = {
          id: Date.now().toString(),
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date(),
          name: `Voice Note ${new Date().toLocaleTimeString()}`
        };

        setRecordings(prev => [recording, ...prev]);
        onRecordingComplete(audioBlob, recordingTime);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak into your microphone to record a voice note.",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const playRecording = (recording: Recording) => {
    // Stop any currently playing audio
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (playingId === recording.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(recording.url);
    audioElementsRef.current[recording.id] = audio;
    
    audio.onended = () => {
      setPlayingId(null);
    };
    
    audio.play();
    setPlayingId(recording.id);
  };

  const downloadRecording = (recording: Recording) => {
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = `${recording.name}.webm`;
    link.click();
  };

  const deleteRecording = (recordingId: string) => {
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    
    // Clean up audio element and URL
    if (audioElementsRef.current[recordingId]) {
      audioElementsRef.current[recordingId].pause();
      delete audioElementsRef.current[recordingId];
    }
    
    if (playingId === recordingId) {
      setPlayingId(null);
    }

    toast({
      title: "Recording deleted",
      description: "Voice note has been removed.",
      variant: "default"
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (blob: Blob) => {
    const bytes = blob.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card>
        <CardContent className="p-6 text-center">
          {hasPermission === false ? (
            <div className="space-y-4">
              <MicOff className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please allow microphone access to record voice notes.
                </p>
                <Button onClick={requestMicrophonePermission}>
                  <Mic className="h-4 w-4 mr-2" />
                  Request Permission
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className={`rounded-full p-4 ${isRecording ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <Mic className={`h-8 w-8 ${isRecording ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </div>
              
              {isRecording && (
                <div className="space-y-2">
                  <div className="text-2xl font-mono font-bold">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-warning' : 'bg-destructive'} animate-pulse`} />
                    <span className="text-sm text-muted-foreground">
                      {isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-destructive hover:bg-destructive/90">
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button variant="outline" onClick={pauseRecording}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={resumeRecording}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button variant="outline" onClick={stopRecording}>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Voice Notes ({recordings.length})</h4>
          {recordings.map((recording) => (
            <Card key={recording.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playRecording(recording)}
                      className="w-10 h-10 p-0"
                    >
                      {playingId === recording.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{recording.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{formatTime(recording.duration)}</span>
                        <span>{formatFileSize(recording.blob)}</span>
                        <span>{recording.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      Voice Note
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadRecording(recording)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecording(recording.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;