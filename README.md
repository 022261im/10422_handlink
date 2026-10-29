# HANDLINK
**Hand Gesture Communication & Accessible Interface**

HANDLINK is a browser-based prototype that connects a small set of hand gestures to communication phrases and a simulated accessible kiosk.

## Features
- Webcam-based hand landmark recognition using MediaPipe Hands.
- Five demo gestures: pointing, open palm, fist, V sign, and thumbs-up.
- Temporal stabilization: a gesture must persist across multiple frames before it triggers an action.
- Communication board with optional Korean text-to-speech.
- Simulated kiosk navigation, confirmation, cancellation, and help screen.
- Session event log and CSV export for exploratory performance testing.

## Run
Open the GitHub Pages site over HTTPS and allow camera access. The first run needs an internet connection to load MediaPipe libraries from jsDelivr. A compatible webcam and modern browser are recommended.

## Research notes
Try changing one condition at a time: camera distance, lighting, or how long a gesture is held. Record known intended gestures separately and compare them with recognition events before calculating accuracy. Event timing alone is not a verified accuracy score.

## Limitations
This is a prototype, not a replacement for a full sign language system or professional augmentative and alternative communication device. The kiosk is a simulation only; no real orders, payments, or staff calls are sent. Camera frames are processed in the browser and are not uploaded by this application.
