// Loaded with import() only when the server uses ALTCHA, so other installs never download it.
// 'altcha/external' is the build without workers inlined as blob: URLs; Vite bundles the PBKDF2 worker as a file of
// our own instead, which a Content Security Policy (roadmap 0.2d) can allow as 'self'.
import 'altcha/external';
import 'altcha/altcha.css';
import Pbkdf2Worker from 'altcha/workers/pbkdf2?worker';

// The server's only algorithm (MDBNavigator.Infrastructure/Captcha/AltchaCaptcha.cs).
globalThis.$altcha.algorithms.set('PBKDF2/SHA-256', () => new Pbkdf2Worker());
