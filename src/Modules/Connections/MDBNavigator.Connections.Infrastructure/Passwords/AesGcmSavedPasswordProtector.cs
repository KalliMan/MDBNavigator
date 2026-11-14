using MDBNavigator.Connections.Application.SavedConnections;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace MDBNavigator.Connections.Infrastructure.Passwords
{
    // AES-GCM with a 256-bit key from SavedConnections:PasswordKey. Not Data Protection: its keys are stored in the same
    // SQLite file as these passwords, so the file alone would be enough to read them.
    //
    // Stored value: version (1 byte, 1) | key id (4) | nonce (12) | tag (16) | ciphertext (UTF-8 password).
    // The key id (first 4 bytes of SHA-256 of the key) tells a value written with another key apart without decrypting.
    // The nonce is random per value: a 96-bit random nonce is safe for far more passwords than one instance will ever store.
    // The associated data binds the value to its row (id and owner), so it can't be moved to another row or user.
    public sealed class AesGcmSavedPasswordProtector : ISavedPasswordProtector
    {
        private const byte FormatVersion = 1;
        private const int KeyIdSize = 4;
        private const int NonceSize = 12;
        private const int TagSize = 16;
        private const int HeaderSize = 1 + KeyIdSize + NonceSize + TagSize;

        private readonly byte[]? _key;
        private readonly byte[] _keyId = [];

        public AesGcmSavedPasswordProtector(byte[]? key, ILogger<AesGcmSavedPasswordProtector> logger)
        {
            _key = key;
            if (key is not null)
            {
                _keyId = SHA256.HashData(key)[..KeyIdSize];
            }
            logger.LogInformation("Remembered passwords: {State}", key is null ? "off (SavedConnections:PasswordKey not set)" : "on");
        }

        public bool Enabled => _key is not null;

        public byte[] Protect(string password, Guid savedConnectionId, string ownerId)
        {
            if (_key is null)
            {
                throw new InvalidOperationException("Remembering passwords is not turned on.");
            }

            var plaintext = Encoding.UTF8.GetBytes(password);
            try
            {
                var result = new byte[HeaderSize + plaintext.Length];
                result[0] = FormatVersion;
                _keyId.CopyTo(result.AsSpan(1, KeyIdSize));

                var nonce = result.AsSpan(1 + KeyIdSize, NonceSize);
                var tag = result.AsSpan(1 + KeyIdSize + NonceSize, TagSize);
                var ciphertext = result.AsSpan(HeaderSize);
                // Random for each value, never derived from the id or a counter.
                RandomNumberGenerator.Fill(nonce);

                // A new instance per call: it's cheap, and it avoids any question about sharing one across threads.
                using var aes = new AesGcm(_key, TagSize);
                aes.Encrypt(nonce, plaintext, ciphertext, tag, AssociatedData(savedConnectionId, ownerId));
                return result;
            }
            finally
            {
                CryptographicOperations.ZeroMemory(plaintext);
            }
        }

        public bool IsCurrent(byte[] protectedPassword)
            => _key is not null
               && protectedPassword.Length >= HeaderSize
               && protectedPassword[0] == FormatVersion
               && protectedPassword.AsSpan(1, KeyIdSize).SequenceEqual(_keyId);

        public string? Unprotect(byte[] protectedPassword, Guid savedConnectionId, string ownerId)
        {
            if (_key is null || !IsCurrent(protectedPassword))
            {
                return null;
            }

            var plaintext = new byte[protectedPassword.Length - HeaderSize];
            try
            {
                var nonce = protectedPassword.AsSpan(1 + KeyIdSize, NonceSize);
                var tag = protectedPassword.AsSpan(1 + KeyIdSize + NonceSize, TagSize);
                var ciphertext = protectedPassword.AsSpan(HeaderSize);

                using var aes = new AesGcm(_key, TagSize);
                aes.Decrypt(nonce, ciphertext, tag, plaintext, AssociatedData(savedConnectionId, ownerId));
                return Encoding.UTF8.GetString(plaintext);
            }
            catch (CryptographicException)
            {
                // Changed, damaged, or moved to another row or owner: the same as no password at all.
                return null;
            }
            finally
            {
                CryptographicOperations.ZeroMemory(plaintext);
            }
        }

        private static byte[] AssociatedData(Guid id, string ownerId)
            => Encoding.UTF8.GetBytes($"MDBNavigator saved connection password v1\n{id:D}\n{ownerId}");
    }
}
