const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const OpenAI = require("openai");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Database
const database = require("./database/connection");
const Call = require("./models/Call");
const CallNote = require("./models/CallNote");
const SystemSettings = require("./models/SystemSettings");

// Authentication routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Authentication routes
app.use('/auth', authRoutes);

// Admin routes (requires authentication)
const { authenticateToken } = require('./middleware/auth');
app.use('/admin', authenticateToken, adminRoutes);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory storage for active streaming data (temporary during call)
const audioStreams = new Map();

// Store active calls for status tracking
const activeCalls = new Map();

// Store dashboard WebSocket connections for broadcasting
const dashboardClients = new Set();

// Debug logging helper
const wsDebug = (message, data = '') => {
  console.log(`🔌 WebSocket DEBUG: ${message}`, data);
};


// Initialize database connection
database.connect().then(async () => {
  console.log('Database initialized successfully');
  
  // Create default admin user if none exists
  try {
    await User.createAdminIfNone();
  } catch (error) {
    console.error('Error creating default admin:', error);
  }

  // Initialize default system settings
  try {
    await SystemSettings.initializeDefaults();
  } catch (error) {
    console.error('Error initializing system settings:', error);
  }
}).catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});

// WebSocket server for audio streaming and dashboard updates
wsDebug('Initializing WebSocket server...');
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false // Disable compression for better debugging
});

wsDebug('WebSocket server created, setting up connection handler');

wss.on('connection', (ws, req) => {
  const url = req.url || '';
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  wsDebug(`New WebSocket connection attempt from ${clientIP}`, { url, headers: req.headers });

  // Determine connection type based on URL path
  if (url.startsWith('/ws') || url.startsWith('/dashboard')) {
    wsDebug('Routing to dashboard handler');
    handleDashboardConnection(ws, req);
  } else {
    wsDebug('Routing to audio stream handler');
    handleAudioStreamConnection(ws, req);
  }
});

wss.on('error', (error) => {
  wsDebug('WebSocket server error:', error);
});

function handleDashboardConnection(ws, req) {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  wsDebug(`Dashboard WebSocket connection established from ${clientIP}`);

  // Add to dashboard clients
  dashboardClients.add(ws);
  wsDebug(`Added client to dashboard set. Total clients: ${dashboardClients.size}`);

  // Add error handler
  ws.on('error', (error) => {
    wsDebug('Dashboard WebSocket error:', error);
    dashboardClients.delete(ws);
    wsDebug(`Removed client due to error. Total clients: ${dashboardClients.size}`);
  });

  // Send initial stats after a brief delay to ensure connection is stable
  setTimeout(async () => {
    wsDebug('Attempting to send initial dashboard stats...');
    if (ws.readyState === WebSocket.OPEN) {
      try {
        await sendDashboardStats(ws);
        wsDebug('Initial dashboard stats sent successfully');
      } catch (error) {
        wsDebug('Error sending initial dashboard stats:', error);
      }
    } else {
      wsDebug(`WebSocket not ready for initial stats. ReadyState: ${ws.readyState}`);
    }
  }, 1000);

  ws.on('message', (message) => {
    try {
      wsDebug('Received dashboard message:', message.toString());
      const data = JSON.parse(message);

      if (data.type === 'ping') {
        wsDebug('Responding to ping with pong');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } else if (data.type === 'requestStats') {
        wsDebug('Received stats request');
        sendDashboardStats(ws);
      }
    } catch (error) {
      wsDebug('Error processing dashboard WebSocket message:', error);
    }
  });

  ws.on('close', (code, reason) => {
    wsDebug(`Dashboard WebSocket connection closed: code=${code}, reason=${reason}`);
    dashboardClients.delete(ws);
    wsDebug(`Removed client due to close. Total clients: ${dashboardClients.size}`);
  });
}

function handleAudioStreamConnection(ws, req) {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  wsDebug(`Audio stream WebSocket connection established from ${clientIP}`);

  let audioBuffer = [];
  let callSid = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.event === 'connected') {
        wsDebug('Audio stream connected');
      } else if (data.event === 'start') {
        callSid = data.start.callSid;
        wsDebug(`Audio stream started for call: ${callSid}`);
        audioStreams.set(callSid, { ws, audioBuffer: [], startTime: new Date() });

        // Broadcast call start to dashboard clients
        broadcastToDashboard({ type: 'callStarted', callSid, timestamp: new Date() });
      } else if (data.event === 'media') {
        // Store audio data for later processing
        if (callSid && audioStreams.has(callSid)) {
          audioStreams.get(callSid).audioBuffer.push(data.media.payload);
        }
      } else if (data.event === 'stop') {
        wsDebug(`Audio stream stopped for call: ${callSid}`);
        if (callSid && audioStreams.has(callSid)) {
          processAudioStream(callSid);
        }

        // Update call status in database when audio stream stops
        if (callSid) {
          try {
            console.log(`DEBUG: WebSocket stop event - updating call ${callSid} status to completed`);
            const updatedCall = await Call.findOneAndUpdate(
              { callSid },
              {
                status: 'completed',
                endTime: new Date()
              },
              { new: true }
            );

            if (updatedCall) {
              console.log(`SUCCESS: Call ${callSid} marked as completed in database (WebSocket stop)`);
              console.log(`DEBUG: Updated call document (WebSocket stop):`, updatedCall);
            } else {
              console.log(`WARNING: Call ${callSid} not found in database for WebSocket stop update`);
            }

            // Clean up from active calls
            if (activeCalls.has(callSid)) {
              activeCalls.delete(callSid);
              console.log(`Call ${callSid} removed from active calls (WebSocket stop)`);
            }
          } catch (error) {
            console.error(`ERROR: Failed to update call ${callSid} status on WebSocket stop:`, error);
          }
        }

        // Broadcast call end to dashboard clients
        broadcastToDashboard({ type: 'callEnded', callSid, timestamp: new Date() });
      }
    } catch (error) {
      wsDebug('Error processing audio stream WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    wsDebug('Audio stream WebSocket connection closed');
    if (callSid && audioStreams.has(callSid)) {
      processAudioStream(callSid);
    }
  });
}

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});


// Main webhook endpoint - handles all Twilio events
app.post("/webhook", (req, res) => {
  console.log(`Webhook received:`, req.body);

  // Determine event type based on request parameters
  if (req.body.RecordingUrl || req.body.RecordingSid) {
    return handleRecordingEvent(req, res);
  } else if (req.body.ConferenceSid && req.body.StatusCallbackEvent) {
    return handleConferenceEvent(req, res);
  } else if (req.body.CallStatus) {
    // Handle all call status updates (including in-progress, completed, etc.)
    return handleCallStatusEvent(req, res);
  } else {
    return handleIncomingCall(req, res);
  }
});

async function handleIncomingCall(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;
  const callStatus = req.body.CallStatus;

  console.log(
    `Incoming call from ${from} to ${to}, CallSid: ${callSid}, Status: ${callStatus}`
  );

  // Save call to database and add to active calls map
  try {
    console.log(`DEBUG: Attempting to save/update call ${callSid} in database`);
    const savedCall = await Call.findOneAndUpdate(
      { callSid },
      {
        callSid,
        from,
        to,
        status: callStatus || "incoming",
        startTime: new Date(),
        isAssistantCall: from === process.env.USER_PHONE_NUMBER
      },
      { upsert: true, new: true }
    );

    if (savedCall) {
      console.log(`SUCCESS: Call ${callSid} saved to database:`, savedCall);
    } else {
      console.log(`WARNING: Call ${callSid} save returned null`);
    }

    // Add to active calls map for tracking
    activeCalls.set(callSid, {
      from,
      to,
      status: callStatus || "incoming",
      startTime: new Date(),
      conferenceId: null,
      isAssistantCall: from === process.env.USER_PHONE_NUMBER
    });

    console.log(`Call ${callSid} added to active calls`);
  } catch (error) {
    console.error('ERROR: Failed to save call to database:', error);
  }

  // Check if this is YOU calling the Aurora assistant (from your number)
  if (from === process.env.USER_PHONE_NUMBER) {
    // This is your Aurora assistant call - start streaming audio
    twiml.say({
      voice: "alice",
      language: "en-US",
    }, "Aurora AI Assistant connected. Audio streaming started.");
    
    // Start audio streaming to capture the call
    twiml.start().stream({
      url: `wss://${process.env.WEBHOOK_BASE_URL.replace('https://', '')}/audio-stream`,
      track: 'both_tracks' // Capture both inbound and outbound audio
    });
    
    // Keep the call alive for iOS merging
    twiml.pause({ length: 3600 }); // Stay on the line for up to 1 hour
    
  } else {
    // This is a regular call - just answer normally  
    twiml.say("Hello, this call will be recorded for quality purposes.");
    twiml.pause({ length: 300 }); // Keep the call alive for potential merge
  }

  res.type("text/xml");
  res.send(twiml.toString());
}

function handleConferenceEvent(req, res) {
  const conferenceId = req.body.ConferenceSid;
  const status = req.body.StatusCallbackEvent;
  const callSid = req.body.CallSid;

  console.log(
    `Conference ${conferenceId} status: ${status} for call ${callSid}`
  );

  if (status === "conference-start") {
    conferences.set(conferenceId, {
      id: conferenceId,
      participants: [],
      startTime: new Date(),
      recording: null,
    });
  }

  if (status === "participant-join") {
    const conference = conferences.get(conferenceId) || { participants: [] };
    conference.participants.push(callSid);
    conferences.set(conferenceId, conference);

    if (activeCalls.has(callSid)) {
      const call = activeCalls.get(callSid);
      call.conferenceId = conferenceId;
      call.status = "in-conference";
      activeCalls.set(callSid, call);
    }
  }

  res.sendStatus(200);
}

async function handleRecordingEvent(req, res) {
  const recordingUrl = req.body.RecordingUrl;
  const recordingSid = req.body.RecordingSid;
  const callSid = req.body.CallSid;
  const conferenceSid = req.body.ConferenceSid;

  console.log(
    `Recording event: ${recordingSid} for call ${callSid} conference ${conferenceSid}`
  );

  if (recordingSid) {
    try {
      const transcript = await transcribeRecording(recordingSid);
      const notes = await generateNotes(transcript);

      // Store notes with either call SID or conference SID as key
      const storageKey = conferenceSid || callSid;

      callNotes.set(storageKey, {
        recordingSid,
        recordingUrl,
        transcript,
        notes,
        timestamp: new Date(),
        callSid,
        conferenceSid,
      });

      console.log(
        `Notes generated for ${
          conferenceSid ? "conference" : "call"
        } ${storageKey}`
      );
    } catch (error) {
      console.error("Error processing recording:", error);
    }
  }

  // For recording status callbacks, just acknowledge - no TwiML needed
  res.sendStatus(200);
}

async function handleCallStatusEvent(req, res) {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const from = req.body.From;
  const to = req.body.To;

  console.log(`Call status update: ${callSid} - ${callStatus}`);
  console.log(`DEBUG: Starting handleCallStatusEvent logic`);
  console.log(`DEBUG: activeCalls has ${callSid}: ${activeCalls.has(callSid)}`);

  // For initial incoming calls, handle with TwiML
  if (callStatus === "ringing" && !activeCalls.has(callSid)) {
    console.log(`DEBUG: Routing to handleIncomingCall for ringing call`);
    return handleIncomingCall(req, res);
  }

  // Update existing call status
  if (activeCalls.has(callSid)) {
    console.log(`DEBUG: Call found in activeCalls, processing...`);
    const call = activeCalls.get(callSid);
    call.status = callStatus;

    // Detect when call ends to trigger final processing
    if (
      callStatus === "completed" ||
      callStatus === "busy" ||
      callStatus === "failed" ||
      callStatus === "no-answer" ||
      callStatus === "canceled"
    ) {
      call.endTime = new Date();
      console.log(
        `Call ${callSid} ended with status '${callStatus}'. Duration: ${call.endTime - call.startTime}ms`
      );

      // Update call status in database
      try {
        console.log(`DEBUG: Attempting to update call ${callSid} in database with status ${callStatus}`);
        const updateResult = await Call.findOneAndUpdate(
          { callSid },
          {
            status: callStatus,
            endTime: call.endTime
          },
          { new: true } // Return the updated document
        );

        if (updateResult) {
          console.log(`SUCCESS: Call ${callSid} status updated in database: ${callStatus}`);
          console.log(`DEBUG: Updated call document:`, updateResult);
        } else {
          console.log(`WARNING: Call ${callSid} not found in database for update`);
          // Try to find if the call exists at all
          const existingCall = await Call.findOne({ callSid });
          if (existingCall) {
            console.log(`DEBUG: Call exists but update failed:`, existingCall);
          } else {
            console.log(`DEBUG: Call ${callSid} does not exist in database at all`);
          }
        }
      } catch (error) {
        console.error(`ERROR: Failed to update call ${callSid} in database:`, error);
      }

      // Clean up audio streams and remove from active calls
      if (audioStreams.has(callSid)) {
        console.log(`Processing final audio stream for call ${callSid}...`);
        // Process audio stream before cleaning up if it exists
        try {
          await processAudioStream(callSid);
        } catch (error) {
          console.error(`Error processing final audio stream for ${callSid}:`, error);
        }
      }
      activeCalls.delete(callSid);

      // Broadcast call ended event to dashboard
      broadcastToDashboard({
        type: 'callEnded',
        callSid: callSid,
        status: callStatus,
        timestamp: new Date().toISOString()
      });
    } else {
      // Only update the call if it's not ended
      console.log(`DEBUG: Updating call ${callSid} in activeCalls with status ${callStatus}`);
      activeCalls.set(callSid, call);
    }
  } else if (callStatus === "in-progress" || callStatus === "answered") {
    console.log(`DEBUG: Adding new in-progress/answered call ${callSid} to activeCalls`);
    // Track new calls that we might have missed the initial webhook for
    activeCalls.set(callSid, {
      from,
      to,
      status: callStatus,
      startTime: new Date(),
      conferenceId: null,
      isAssistantCall: false,
    });
  } else if (
    callStatus === "completed" ||
    callStatus === "busy" ||
    callStatus === "failed" ||
    callStatus === "no-answer" ||
    callStatus === "canceled"
  ) {
    // Handle calls that end but aren't in memory (after restart)
    console.log(`DEBUG: Call ${callSid} ended with status '${callStatus}' - updating database only (not in activeCalls)`);
    try {
      console.log(`DEBUG: Attempting database-only update for call ${callSid}`);
      const result = await Call.findOneAndUpdate(
        { callSid },
        {
          status: callStatus,
          endTime: new Date()
        },
        { new: true } // Return the updated document
      );

      if (result) {
        console.log(`SUCCESS: Call ${callSid} status updated in database (database-only path): ${callStatus}`);
        console.log(`DEBUG: Updated call document (database-only):`, result);

        // Broadcast call ended event to dashboard
        broadcastToDashboard({
          type: 'callEnded',
          callSid: callSid,
          status: callStatus,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`WARNING: Call ${callSid} not found in database (database-only path)`);
        // Check if call exists at all
        const existingCall = await Call.findOne({ callSid });
        if (existingCall) {
          console.log(`DEBUG: Call exists but database-only update failed:`, existingCall);
        } else {
          console.log(`DEBUG: Call ${callSid} does not exist in database at all (database-only path)`);
        }
      }
    } catch (error) {
      console.error(`ERROR: Failed to update call ${callSid} in database (database-only path):`, error);
    }
  }

  // For status updates, just acknowledge - don't send TwiML
  console.log(`DEBUG: handleCallStatusEvent completed for ${callSid}`);
  res.sendStatus(200);
}

async function transcribeRecording(recordingSid) {
  try {
    console.log(`Transcribing recording: ${recordingSid}`);

    // Use Twilio SDK to fetch the recording
    const recording = await twilioClient.recordings(recordingSid).fetch();

    // Wait a moment for recording to be fully available if still processing
    if (recording.status === "processing") {
      console.log("Recording still processing, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Download the recording using the correct URL format
    const downloadUrl = `https://api.twilio.com${recording.uri.replace(
      ".json",
      ".mp3"
    )}`;

    const recordingResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
    });

    if (!recordingResponse.ok) {
      throw new Error(
        `Failed to download recording: ${recordingResponse.status} ${recordingResponse.statusText}`
      );
    }

    const audioBuffer = await recordingResponse.arrayBuffer();
    const audioFile = new File([audioBuffer], "recording.mp3", {
      type: "audio/mpeg",
    });

    console.log("Sending audio to OpenAI for transcription...");
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    console.log("Transcription completed successfully");
    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    return "Transcription failed";
  }
}

async function generateNotes(transcript) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that creates concise, structured meeting notes from phone call transcripts. Extract key points, action items, and important details.",
        },
        {
          role: "user",
          content: `Please create structured notes from this phone call transcript:\n\n${transcript}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Note generation error:", error);
    return "Note generation failed";
  }
}

async function processAudioStream(callSid) {
  console.log(`Processing audio stream for call: ${callSid}`);
  
  try {
    const streamData = audioStreams.get(callSid);
    if (!streamData || streamData.audioBuffer.length === 0) {
      console.log('No audio data to process');
      return;
    }
    
    // Prevent duplicate processing
    if (streamData.processing) {
      console.log('Audio stream already being processed');
      return;
    }
    streamData.processing = true;
    
    console.log(`Processing ${streamData.audioBuffer.length} audio chunks`);
    
    // Convert Twilio stream data to proper audio format
    // Twilio streams are μ-law (G.711) 8-bit, 8kHz mono audio
    const audioChunks = streamData.audioBuffer.map(chunk => Buffer.from(chunk, 'base64'));
    const combinedAudio = Buffer.concat(audioChunks);
    
    // Create a WAV file with proper header for μ-law audio
    const wavHeader = createMuLawWavHeader(combinedAudio.length);
    const wavBuffer = Buffer.concat([wavHeader, combinedAudio]);
    
    // Create permanent audio file for storage and OpenAI processing
    const audioDir = path.join(__dirname, 'storage', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const audioFileName = `call_${callSid}_${timestamp}.wav`;
    const audioFilePath = path.join(audioDir, audioFileName);

    fs.writeFileSync(audioFilePath, wavBuffer);
    
    console.log(`Created WAV file: ${audioFilePath} (${wavBuffer.length} bytes)`);

    // Transcribe using OpenAI Whisper
    console.log('Sending WAV file to OpenAI for transcription...');
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
    });
    
    console.log(`Transcription result: "${transcript.text}"`);
    
    // Generate notes
    const notes = await generateNotes(transcript.text);
    
    // Store results in MongoDB
    try {
      await CallNote.create({
        callSid,
        streamId: `stream-${callSid}`,
        transcript: transcript.text,
        notes,
        source: 'audio_stream',
        audioChunks: streamData.audioBuffer.length,
        audioSize: wavBuffer.length,
        audioFilePath: audioFilePath,
        audioFileName: audioFileName
      });
      console.log(`Notes saved to database for call ${callSid}`);

      // Broadcast note creation to dashboard clients
      broadcastToDashboard({
        type: 'noteCreated',
        callSid,
        timestamp: new Date(),
        source: 'audio_stream'
      });

    } catch (error) {
      console.error('Error saving notes to database:', error);
    }
    
    console.log(`Stream processing completed for call ${callSid} - audio file saved permanently`);

    // Cleanup memory only (keep audio file)
    audioStreams.delete(callSid);
    
  } catch (error) {
    console.error('Error processing audio stream:', error);
  }
}

function createMuLawWavHeader(dataLength) {
  const buffer = Buffer.alloc(44);
  
  // WAV header for μ-law audio
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(7, 20);  // μ-law format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(8000, 24); // 8kHz sample rate
  buffer.writeUInt32LE(8000, 28); // byte rate
  buffer.writeUInt16LE(1, 32);  // block align
  buffer.writeUInt16LE(8, 34);  // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  
  return buffer;
}

// Dashboard WebSocket functions with comprehensive debugging
async function sendDashboardStats(ws) {
  try {
    wsDebug('sendDashboardStats called');

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      wsDebug(`WebSocket not ready for stats sending. ReadyState: ${ws ? ws.readyState : 'null'}`);
      return;
    }

    wsDebug('Fetching dashboard stats...');
    const stats = await getDashboardStats();
    wsDebug('Dashboard stats fetched:', stats);

    const message = JSON.stringify({
      type: 'statsUpdate',
      data: stats,
      timestamp: new Date().toISOString()
    });

    wsDebug('Sending stats message:', { messageLength: message.length });
    ws.send(message);
    wsDebug('Dashboard stats sent successfully');
  } catch (error) {
    wsDebug('Error sending dashboard stats:', error.message);
    if (error.stack) {
      wsDebug('Stack trace:', error.stack);
    }
  }
}

function broadcastToDashboard(data) {
  wsDebug('Broadcasting to dashboard clients:', data);
  wsDebug(`Current dashboard clients: ${dashboardClients.size}`);

  const message = JSON.stringify(data);

  dashboardClients.forEach((client, index) => {
    wsDebug(`Checking client ${index + 1}/${dashboardClients.size}, readyState: ${client.readyState}`);

    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        wsDebug(`Successfully sent to client ${index + 1}`);
      } catch (error) {
        wsDebug(`Error broadcasting to client ${index + 1}:`, error);
        dashboardClients.delete(client);
      }
    } else {
      wsDebug(`Removing client ${index + 1} due to readyState: ${client.readyState}`);
      dashboardClients.delete(client);
    }
  });

  wsDebug(`Broadcast complete. Remaining clients: ${dashboardClients.size}`);
}

async function getDashboardStats() {
  try {
    const [userStats, callStats, noteStats] = await Promise.all([
      getUserStats(),
      getCallStats(),
      getNoteStats()
    ]);
    
    return {
      users: userStats,
      calls: callStats,
      notes: noteStats
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      users: { total: 0, active: 0, admins: 0, regular: 0, recent: 0 },
      calls: { total: 0, today: 0, thisWeek: 0, assistantCalls: 0 },
      notes: { total: 0, fromStream: 0, fromRecording: 0, recent: 0 }
    };
  }
}

async function getUserStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [total, active, admins, recent] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: weekAgo } })
  ]);
  
  return {
    total,
    active,
    admins,
    regular: total - admins,
    recent
  };
}

async function getCallStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [total, today, thisWeek, assistantCalls] = await Promise.all([
    Call.countDocuments({}),
    Call.countDocuments({ startTime: { $gte: todayStart } }),
    Call.countDocuments({ startTime: { $gte: weekAgo } }),
    Call.countDocuments({ isAssistantCall: true })
  ]);
  
  return {
    total,
    today,
    thisWeek,
    assistantCalls
  };
}

async function getNoteStats() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [total, fromStream, fromRecording, recent] = await Promise.all([
    CallNote.countDocuments({}),
    CallNote.countDocuments({ source: 'audio_stream' }),
    CallNote.countDocuments({ source: 'recording' }),
    CallNote.countDocuments({ createdAt: { $gte: dayAgo } })
  ]);
  
  return {
    total,
    fromStream,
    fromRecording,
    recent
  };
}

app.get("/active-calls", authenticateToken, async (req, res) => {
  try {
    // Convert the Map to an array of call objects
    const activeCallsArray = Array.from(activeCalls.entries()).map(([callSid, call]) => ({
      callSid,
      ...call
    }));

    // Sort by start time, most recent first
    activeCallsArray.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    res.json(activeCallsArray);
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ error: 'Failed to fetch active calls' });
  }
});

app.get("/call-notes/:callSid", authenticateToken, async (req, res) => {
  try {
    const callSid = req.params.callSid;
    const notes = await CallNote.findOne({ callSid });

    if (!notes) {
      return res.status(404).json({ error: "Notes not found for this call" });
    }

    res.json(notes);
  } catch (error) {
    console.error('Error fetching call notes:', error);
    res.status(500).json({ error: 'Failed to fetch call notes' });
  }
});

app.get("/all-notes", authenticateToken, async (req, res) => {
  try {
    const allNotes = await CallNote.find({}).sort({ createdAt: -1 });
    res.json(allNotes);
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Check if audio file exists for a specific call (HEAD request)
app.head("/download-audio/:callSid", authenticateToken, async (req, res) => {
  try {
    const callSid = req.params.callSid;
    const callNote = await CallNote.findOne({ callSid });

    if (!callNote || !callNote.audioFilePath) {
      return res.status(404).end();
    }

    // Check if file exists on disk
    if (!fs.existsSync(callNote.audioFilePath)) {
      return res.status(404).end();
    }

    // File exists, return OK
    res.status(200).end();
  } catch (error) {
    console.error('Error checking audio file:', error);
    res.status(500).end();
  }
});

// Download audio file for a specific call
app.get("/download-audio/:callSid", authenticateToken, async (req, res) => {
  try {
    const callSid = req.params.callSid;
    const callNote = await CallNote.findOne({ callSid });

    if (!callNote || !callNote.audioFilePath) {
      return res.status(404).json({ error: 'Audio file not found for this call' });
    }

    const audioFilePath = callNote.audioFilePath;

    // Check if file exists on disk
    if (!fs.existsSync(audioFilePath)) {
      return res.status(404).json({ error: 'Audio file not found on server' });
    }

    // Set appropriate headers for audio download
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${callNote.audioFileName || `call_${callSid}.wav`}"`);

    // Stream the file to the client
    const fileStream = fs.createReadStream(audioFilePath);
    fileStream.pipe(res);

    console.log(`Audio file downloaded for call ${callSid}: ${audioFilePath}`);
  } catch (error) {
    console.error('Error downloading audio file:', error);
    res.status(500).json({ error: 'Failed to download audio file' });
  }
});

// Get list of all calls with available audio files
app.get("/audio-files", authenticateToken, async (req, res) => {
  try {
    const callsWithAudio = await CallNote.find(
      { audioFilePath: { $exists: true, $ne: null } }
    ).select('callSid audioFileName audioFilePath audioSize createdAt transcript').sort({ createdAt: -1 });

    // Verify files still exist on disk and format response
    const availableFiles = [];
    for (const call of callsWithAudio) {
      if (fs.existsSync(call.audioFilePath)) {
        availableFiles.push({
          callSid: call.callSid,
          fileName: call.audioFileName,
          fileSize: call.audioSize,
          createdAt: call.createdAt,
          hasTranscript: !!call.transcript,
          downloadUrl: `/download-audio/${call.callSid}`
        });
      }
    }

    res.json(availableFiles);
  } catch (error) {
    console.error('Error fetching audio files list:', error);
    res.status(500).json({ error: 'Failed to fetch audio files list' });
  }
});

app.post("/end-call/:callSid", authenticateToken, async (req, res) => {
  const callSid = req.params.callSid;

  try {
    await twilioClient.calls(callSid).update({ status: "completed" });

    // Update call in database
    await Call.findOneAndUpdate(
      { callSid },
      { 
        status: "ended",
        endTime: new Date()
      }
    );

    res.json({ success: true, message: "Call ended successfully" });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ error: "Failed to end call" });
  }
});

// Periodic dashboard stats broadcasting (every 30 seconds) with debug logging
setInterval(async () => {
  wsDebug(`Periodic broadcast check. Dashboard clients: ${dashboardClients.size}`);
  if (dashboardClients.size > 0) {
    try {
      const stats = await getDashboardStats();
      broadcastToDashboard({
        type: 'statsUpdate',
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      wsDebug('Error in periodic stats broadcast:', error);
    }
  }
}, 30000);

server.listen(port, () => {
  console.log(`Aurora IVR Assistant server running on port ${port}`);
  wsDebug('WebSocket server ready for audio streaming and dashboard updates');
  console.log('🔌 WebSocket debugging enabled - check logs for detailed connection info');
  console.log(
    `Make sure to set your Twilio webhook URL to: ${process.env.WEBHOOK_BASE_URL}/webhook`
  );
});
